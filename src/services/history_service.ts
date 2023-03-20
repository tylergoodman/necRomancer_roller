import { injectable } from 'inversify';
import { fromEvent, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

import { DestroyableService } from './destroyable_service';

@injectable()
export class HistoryService<T> extends DestroyableService {
  readonly stateChange$ = new Subject<T>();

  constructor() {
    super();
    fromEvent(window, 'popstate').pipe(
      map((e) => (e as PopStateEvent).state as T),
      takeUntil(this.destroyed$),
    ).subscribe((state) => {
      this.stateChange$.next(state);
    });
  }

  push<T>(state: T) {
    history.pushState(state, '');
  }
}
