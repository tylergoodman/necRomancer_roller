import '@kor-ui/kor/components/button';
import '@kor-ui/kor/components/input';
import '@kor-ui/kor/components/modal';
// This just imports the type. The former imports actually import the element.
import { type korModal } from '@kor-ui/kor/components/modal';
import { html, unsafeCSS } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';
import { createRef, Ref, ref } from 'lit/directives/ref.js';
import { takeUntil } from 'rxjs';

import { makeSavedObject } from '../common/make_saved_object';
import { FormController, FormGroupController } from '../directives/form';
import { HistoryService } from '../services/history_service';
import { BaseLitElement, inject } from './base_lit_element';
import { AttackRoll, roll, RollResult } from './roll';
import { default as styles } from './nec_romancer.scss?inline';

const SKELETON_ATTACK: AttackRoll = {
  desc: 'Skeleton (shortbow)',
  hitMod: 4,
  damageMod: 6,
};

const ZOMBIE_ATTACK: AttackRoll = {
  desc: 'Zombie (bash)',
  hitMod: 3,
  damageMod: 3,
};

interface NecRomancerState {
  skeletons: number;
  skeletonWeapons: number;
  zombies: number;
}

interface NecRomancerHistoryState {
  skeletonRoll?: readonly RollResult[];
  zombieRoll?: readonly RollResult[];
}

@customElement('nec-romancer')
export class NecRomancer extends BaseLitElement {
  static override styles = unsafeCSS(styles);
  private readonly state = makeSavedObject<NecRomancerState>('state', {
    skeletons: 0,
    skeletonWeapons: 0,
    zombies: 0,
  });
  private readonly form = this.createConnectedForm();
  private readonly dialogRef: Ref<korModal> = createRef();

  @inject(HistoryService)
  private readonly historyService!: HistoryService<NecRomancerHistoryState>;

  @state()
  private rolls?: NecRomancerHistoryState;

  constructor() {
    super();
    this.form.change$.pipe(takeUntil(this.destroyed$)).subscribe((val) => {
      console.log(val);
    });
    this.historyService.stateChange$.pipe(takeUntil(this.destroyed$)).subscribe(
      (state) => {
        this.rolls = state;
      },
    );
  }

  override firstUpdated() {
    // this.rollMinions();
  }

  private createConnectedForm() {
    type Key = keyof NecRomancerState;
    const controls = {} as {
      [K in Key]: FormController<NecRomancerState[K]>;
    };
    for (const key of Object.keys(this.state)) {
      // idk here either
      (controls as any)[key] = this.createConnectedControl(key as Key);
    }
    return new FormGroupController(this, controls);
  }

  private createConnectedControl<K extends keyof NecRomancerState>(
    name: K,
  ): FormController<NecRomancerState[K]> {
    const control = new FormController(this.state[name]);
    control.changed$.pipe(takeUntil(this.destroyed$)).subscribe((value) => {
      this.state[name] = value;
    });
    return control;
  }

  private rollMinions() {
    this.rolls = {
      skeletonRoll: this.rollSkeletons(),
      zombieRoll: this.rollZombies(),
    };
    this.historyService.push(this.rolls);
    this.dialogRef.value!.visible = true;
  }

  private ensureStateIsNumber(key: keyof NecRomancerState) {
    if (typeof this.state[key] !== 'number' || this.state[key] < 0) {
      this.state[key] = 0;
    }
  }

  private rollZombies(): readonly RollResult[] {
    this.ensureStateIsNumber('zombies');
    const result: RollResult[] = [];
    for (let i = 0; i < this.state.zombies; i++) {
      result.push(roll({
        sides: 6,
        numberOfDice: 1,
        ...ZOMBIE_ATTACK,
      }));
    }
    return result;
  }

  private rollSkeletons(): readonly RollResult[] {
    this.ensureStateIsNumber('skeletons');
    this.ensureStateIsNumber('skeletonWeapons');
    const helperSkeletons = Math.max(
      this.state.skeletons - this.state.skeletonWeapons,
      0,
    );
    const attackingSkeletons = Math.min(
      this.state.skeletons,
      this.state.skeletonWeapons,
    );
    const result: RollResult[] = [];
    for (let i = 0; i < attackingSkeletons; i++) {
      const advantage = i < helperSkeletons;
      result.push(roll({
        sides: 6,
        numberOfDice: 1,
        advantage,
        ...SKELETON_ATTACK,
      }));
    }
    return result;
  }

  override render() {
    // deno-fmt-ignore
    return html`
      <form>
        <kor-input
          label="Skeletons"
          pattern="\\d*" 
          type="number"
          ${this.form.control('skeletons')}>
        </kor-input>
        <kor-input
          label="with weapons"
          class="sub"
          pattern="\\d*" 
          type="number"
          ${this.form.control('skeletonWeapons')}>
        </kor-input>
        <kor-input
          label="Zombies"
          pattern="\\d*" 
          type="number"
          ${this.form.control('zombies')}>
        </kor-input>
        <kor-button
          label="Roll"
          @click=${this.rollMinions}></kor-button>
      </form>
      <kor-modal
        ${ref(this.dialogRef)}
        height="98vh"
        width="min(800px, 98vw)">
        ${map(this.rolls?.skeletonRoll, (result) => html`
          <roll-result .result=${result}></roll-result>
        `)}
        ${map(this.rolls?.zombieRoll, (result) => html`
          <roll-result .result=${result}></roll-result>
        `)}
        <kor-button
          slot="footer"
          color="secondary"
          @click=${this.rollMinions}>
          Reroll
        </kor-button>
      </kor-modal>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'nec-romancer': NecRomancer;
  }
}
