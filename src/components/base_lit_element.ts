import {
  ContextConsumer,
  ContextProvider,
  createContext,
} from '@lit-labs/context';
import { Container, interfaces } from 'inversify';
import { LitElement } from 'lit';
import { ReplaySubject } from 'rxjs';

const CONTAINER_OPTIONS: Readonly<interfaces.ContainerOptions> = {
  defaultScope: 'Singleton',
  autoBindInjectable: true,
};
const parentInjectorContext = createContext<Container>(
  Symbol('parentInjectorContext'),
);

export function inject<T extends BaseLitElement, K>(
  symbol: interfaces.ServiceIdentifier<K>,
) {
  return function (target: T, propertyKey: string | symbol) {
    Object.defineProperty(target, propertyKey, {
      configurable: false,
      enumerable: true,
      get(this: T) {
        return this.injector.get(symbol);
      },
    });
  };
}

export abstract class BaseLitElement extends LitElement {
  protected readonly destroyed$ = new ReplaySubject<void>(1);

  protected readonly injector = new Container(CONTAINER_OPTIONS);

  constructor() {
    super();
    new ContextConsumer(this, {
      context: parentInjectorContext,
      // Since this isn't immediately ready, calls to `@inject` will create new
      // services in this element's injector rather than pulling the existing
      // one from a parent's cache. Not sure how to fix this yet.
      callback: (parentInjector) => this.injector.parent = parentInjector,
    });
    new ContextProvider(this, {
      context: parentInjectorContext,
      initialValue: this.injector,
    });
  }

  override disconnectedCallback() {
    this.destroyed$.next();
    this.destroyed$.complete();
    this.injector.unbindAll();
  }
}
