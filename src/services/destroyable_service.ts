import { injectable, preDestroy } from 'inversify';
import { Subject } from 'rxjs';

@injectable()
export abstract class DestroyableService {
  protected readonly destroyed$ = new Subject<void>();

  @preDestroy()
  protected destroyed() {
    this.destroyed$.next();
  }
}
