import { korInput } from '@kor-ui/kor/components/input';
import {
  ElementPart,
  nothing,
  ReactiveController,
  ReactiveControllerHost,
} from 'lit';
import { AsyncDirective } from 'lit/async-directive.js';
import {
  directive,
  DirectiveParameters,
  PartInfo,
  PartType,
} from 'lit/directive.js';
import { BehaviorSubject, fromEvent, merge, Observable, Subject } from 'rxjs';
import { distinctUntilChanged, map, takeUntil } from 'rxjs/operators';

import { assertExists } from '../common/asserts';

type FormElement =
  | HTMLInputElement
  | HTMLTextAreaElement
  | HTMLSelectElement
  | korInput;

// Derived from https://netbasal.com/supercharge-your-forms-in-web-components-with-lit-5df42430907a
interface ValueAccessor<T> {
  modelToView(element: FormElement, value: T): void;
  viewToModel(element: FormElement): Observable<T>;
}

const valueAccessors: Record<string, ValueAccessor<unknown>> = {
  'kor-input[type=number]': {
    modelToView(element: FormElement, value: number) {
      const asString = value?.toString(10) ?? '';
      element.setAttribute('value', asString);
    },
    viewToModel(element: FormElement) {
      return fromEvent(element, 'value-changed').pipe(
        map((e: Event) =>
          Number.parseFloat((e.target as HTMLInputElement).value)
        ),
      );
    },
  },
  '[type=number]': {
    modelToView(element: FormElement, value: number) {
      const asString = value?.toString(10) ?? '';
      element.setAttribute('value', asString);
      (element as HTMLInputElement).value = asString;
    },
    viewToModel(element: FormElement) {
      return fromEvent(element, 'input').pipe(
        map((e: Event) =>
          Number.parseFloat((e.target as HTMLInputElement).value)
        ),
      );
    },
  },
  '[type=checkbox]': {
    modelToView(element: FormElement, value: boolean) {
      element.setAttribute('value', value.toString());
      (element as HTMLInputElement).checked = value;
    },
    viewToModel(element: FormElement) {
      return fromEvent(element, 'change').pipe(
        map((e: Event) => (e.target as HTMLInputElement).checked),
      );
    },
  },
  'input': {
    modelToView(element: FormElement, value: string) {
      element.setAttribute('value', value);
      (element as HTMLInputElement).value = value;
    },
    viewToModel(element: FormElement) {
      return fromEvent(element, 'change').pipe(
        map((e: Event) => (e.target as HTMLInputElement).value),
      );
    },
  },
};

export class ControlDirective<T> extends AsyncDirective {
  private readonly disconnected$ = new Subject<void>();
  private controller?: FormController<T>;
  private element?: FormElement;
  private initialized = false;

  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (partInfo.type !== PartType.ELEMENT) {
      throw new Error('Form control should be placed on an element.');
    }
  }

  private get valueAccessor(): ValueAccessor<T> {
    assertExists(this.element);

    for (const [selector, accessor] of Object.entries(valueAccessors)) {
      if (this.element.matches(selector)) {
        return accessor as ValueAccessor<T>;
      }
    }
    return valueAccessors['input'] as ValueAccessor<T>;
  }

  private initialize() {
    assertExists(this.element);
    assertExists(this.controller);
    const valueAccessor = this.valueAccessor;

    // Set the initial control value.
    valueAccessor.modelToView(this.element, this.controller.getValue());

    // Set the control value when the model changes.
    this.controller.changed$.pipe(takeUntil(this.disconnected$)).subscribe(
      (value: T) => {
        if (this.element) {
          valueAccessor.modelToView(this.element, value);
        }
      },
    );

    // Set the control name when the model changes.
    this.controller.name$.pipe(takeUntil(this.disconnected$)).subscribe(
      (name) => {
        this.element?.setAttribute('name', name);
      },
    );

    // Set the model value when the control changes.
    valueAccessor.viewToModel(this.element).pipe(takeUntil(this.disconnected$))
      .subscribe((value: T) => {
        this.controller?.setValue(value);
      });
  }

  override update(part: ElementPart, [control]: DirectiveParameters<this>) {
    if (!this.initialized) {
      this.controller = control;
      this.element = part.element as FormElement;
      this.initialize();
      this.initialized = true;
    }
    return nothing;
  }

  render(_control: FormController<T>) {
    return nothing;
  }

  protected override disconnected() {
    this.disconnected$.next();
    this.controller = undefined;
    this.element = undefined;
    this.initialized = false;
  }
}

const controlDirective = directive(ControlDirective);

export class FormController<T> {
  private readonly _changed$ = new Subject<T>();
  readonly changed$ = this._changed$.asObservable().pipe(
    distinctUntilChanged(),
  );
  readonly name$ = new BehaviorSubject('');

  constructor(private value: T) {}

  setValue(value: T, { emit = true } = {}) {
    this.value = value;
    if (emit) {
      this._changed$.next(value);
    }
  }

  getValue() {
    return this.value;
  }
}

export class FormGroupController<T extends {}> implements ReactiveController {
  private readonly _change$ = new Subject<T>();
  private readonly disconnected$ = new Subject<void>();

  readonly change$ = this._change$.asObservable();

  constructor(
    private readonly host: ReactiveControllerHost,
    readonly controls: { [K in keyof T]: FormController<T[K]> },
  ) {
    this.host.addController(this);
  }

  private get controlIterator(): Iterable<
    readonly [keyof T, FormController<T[keyof T]>]
  > {
    const controls = this.controls;
    function* controlIterator() {
      for (const [key, control] of Object.entries(controls)) {
        yield [key as keyof T, control as FormController<T[keyof T]>] as const;
      }
    }
    return controlIterator();
  }

  hostConnected() {
    // Emit when any of our controls emit.
    merge(
      ...Array.from(this.controlIterator).map(([_name, control]) =>
        control.changed$
      ),
    ).pipe(takeUntil(this.disconnected$))
      .subscribe(() => {
        this._change$.next(this.value);
      });
  }

  hostDisconnected() {
    this.disconnected$.next();
  }

  private get value() {
    const value = {} as T;
    for (const [key, control] of this.controlIterator) {
      value[key] = control.getValue();
    }
    return value;
  }

  control(name: keyof T) {
    const control = this.controls[name] as FormController<unknown>;
    control.name$.next(name as string);
    return controlDirective(control);
  }
}
