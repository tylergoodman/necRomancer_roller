import { html, nothing, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { default as styles } from './roll.scss?inline';
import { BaseLitElement } from './base_lit_element';

function getRandomIntInclusive(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  // The maximum is inclusive and the minimum is inclusive.
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function sum(nums: readonly number[] = []) {
  return nums.reduce((acc, curr) => acc + curr, 0);
}

interface RollArgs
  extends Partial<Omit<AttackRoll, 'desc'>>, Pick<AttackRoll, 'desc'> {
  sides: number;
  numberOfDice: number;

  advantage?: boolean;
}

export interface AttackRoll {
  hitMod: number;
  damageMod: number;
  desc: string;
}

type Roll = readonly number[];

export interface RollResult extends AttackRoll {
  hitRoll: number;
  advHitRoll?: number;
  damageRoll: Roll;
  advDamageRoll?: Roll;
}

function rollDamage(
  sides: RollArgs['sides'],
  numberOfDice: RollArgs['numberOfDice'],
): Roll {
  const roll: number[] = [];
  for (let i = 0; i < numberOfDice; i++) {
    roll.push(getRandomIntInclusive(1, sides));
  }
  return roll;
}

export function roll({
  desc,
  sides,
  numberOfDice,

  hitMod = 0,
  damageMod = 0,
  advantage = false,
}: RollArgs): RollResult {
  return {
    desc,
    hitRoll: getRandomIntInclusive(1, 20),
    advHitRoll: advantage ? getRandomIntInclusive(1, 20) : undefined,
    hitMod,
    damageRoll: rollDamage(sides, numberOfDice),
    advDamageRoll: advantage ? rollDamage(sides, numberOfDice) : undefined,
    damageMod,
  };
}

@customElement('roll-result')
export class RollResultElement extends BaseLitElement {
  static override styles = unsafeCSS(styles);
  @property()
  result?: RollResult;

  private renderRoll(roll: Roll, mod: number, max: number) {
    const rollValue = sum(roll) + mod;
    return html`
      <div class="roll ${classMap({ best: rollValue === max })}">
        <div>${rollValue}</div>
        <div>${roll.concat(mod).join(' + ')}</div>
      </div>
    `;
  }

  override render() {
    if (!this.result) {
      return nothing;
    }
    const {
      advDamageRoll,
      advHitRoll,
      damageMod,
      damageRoll,
      desc,
      hitMod,
      hitRoll,
    } = this.result;
    const hit = Math.max(hitRoll, advHitRoll ?? 0) + hitMod;
    const damage = Math.max(sum(damageRoll), sum(advDamageRoll)) + damageMod;
    // deno-fmt-ignore
    return html`
      <h4 class="desc">${desc}</h4>
      <h5 class="hit-label"><span>to hit</span></h5>
      <div class="hit-rolls roll-section">
        ${this.renderRoll([hitRoll], hitMod, hit)}
        ${advHitRoll ? this.renderRoll([advHitRoll], hitMod, hit) : nothing}
      </div>
      <h5 class="damage-label"><span>damage</span></h5>
      <div class="damage-rolls roll-section">
        ${this.renderRoll(damageRoll, damageMod, damage)}
        ${advDamageRoll ? this.renderRoll(advDamageRoll, damageMod, damage) : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'roll-result': RollResultElement;
  }
}
