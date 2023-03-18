import {makeSavedObject} from './makeSavedObject.js';
import {makeNumberInput, makeButton, showRollsDialog} from './dom.js';
import {roll} from './roll.js';
import {groupBy} from './helpers.js';

const options = makeSavedObject('options', {
  skeletons: 0,
  skeletonWeapons: 0,
  zombies: 0,
});

function getMinionRollString() {
  const rollStringCollector = [];
  // Figure out how many skeletons are rolling with advantage.
  const helperSkeles = options.skeletons - options.skeletonWeapons;
  const skeletonsWithAdvantage = helperSkeles > 0 ? helperSkeles : 0;
  for (let i = 0; i < options.skeletonWeapons; i++) {
    const hasAdvantage = i < skeletonsWithAdvantage;
    const hitModifier = 4;
    rollStringCollector.push(hasAdvantage ? `(2d20k1)+${hitModifier}` : `1d20+${hitModifier}`);
    const damageModifier = 6;
    rollStringCollector.push(`1d6+${damageModifier}`);
  }
  for (let i = 0; i < options.zombies; i++) {
    const hitModifier = 3;
    rollStringCollector.push(`1d20+${hitModifier}`);
    const damageModifier = 3;
    rollStringCollector.push(`1d6+${damageModifier}`);
  }
  const rollString = rollStringCollector.join(' ');
  return rollString;
}

function rollMinions() {
  const rolls = [];
  // Figure out how many skeletons are rolling with advantage.
  const helperSkeles = options.skeletons - options.skeletonWeapons;
  const skeletonsWithAdvantage = Math.max(helperSkeles, 0);
  for (let i = 0; i < options.skeletonWeapons; i++) {
    const hasAdvantage = i < skeletonsWithAdvantage;
    const hitModifier = 4;
    const damageModifier = 6;
    rolls.push({
      source: 'Skeleton (shortbow)',
      toHit: roll(1, 20, hitModifier, hasAdvantage),
      damage: roll(1, 6, damageModifier),
    });
  }
  for (let i = 0; i < options.zombies; i++) {
    const hitModifier = 3;
    const damageModifier = 3;
    rolls.push({
      source: 'Zombie (bash)',
      toHit: roll(1, 20, hitModifier),
      damage: roll(1, 6, damageModifier),
    });
  }
  console.log(rolls);
  const sections = [];
  for (const [label, rollsForLabel] of groupBy(rolls, roll => roll.source)) {
    sections.push({
      label,
      rolls: rollsForLabel,
    });
  }
  showRollsDialog({
    sections,
  });
}

const inputs = {
  skeletons: makeNumberInput({
    label: 'Skeletons',
    value: options.skeletons,
    onChange: value => options.skeletons = value,
  }),
  weapons: makeNumberInput({
    label: 'with weapons',
    value: options.skeletonWeapons,
    subInput: true,
    onChange: value => options.skeletonWeapons = value,
  }),
  zombies: makeNumberInput({
    label: 'Zombies',
    value: options.zombies,
    onChange: value => options.zombies = value,
  }),
  rollUndead: makeButton({
    label: 'Roll minions',
    onClick: () => {
      rollMinions();
    },
  }),
};