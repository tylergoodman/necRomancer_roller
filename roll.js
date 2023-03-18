
function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min); // The maximum is inclusive and the minimum is inclusive
}

function sum(nums) {
  let total = 0;
  for (const num of nums) {
    total += num;
  }
  return total;
}

class DiceRoll {
  withDice(count = 0) {
    this.count = count;
    return this;
  }
  withSides(sides = 0) {
    this.sides = sides;
    return this;
  }
  withAdvantage(advantage = true) {
    this.advantage = advantage;
    return this;
  }
  withModifier(modifier = 0) {
    this.modifier = modifier;
    return this;
  }
  roll() {
    const {count = 0, sides = 0, advantage = false} = this;
    const roll = () => {
      const rolls = [];
      for (let i = 0; i < count; i++) {
        rolls.push(getRandomIntInclusive(1, sides));
      }
      return rolls;
    };
    const firstRoll = roll();
    if (!advantage) {
      this.roll = firstRoll;
      return this;
    }
    const secondRoll = roll();
    if (sum(firstRoll) > sum(secondRoll)) {
      this.roll = firstRoll;
      this.dropped = secondRoll;
    } else {
      this.roll = secondRoll;
      this.dropped = firstRoll;
    }
    return this;
  }
  isCrit() {
    const {roll = [], sides = 0} = this;
    return sides === 20 && count === 1 && sum(roll) === 20;
  }
  valueOf() {
    const {roll = [], modifier = 0} = this;
    return sum(roll) + modifier;
  }
  toString() {
    this.roll();
    const {roll = [], count = 0, sides = 0, modifier = 0, dropped} = this;
    const baseRoll = sum(roll);
    const value = baseRoll + modifier;
    const modifierSign = modifier < 0 ? `-` : '+';
    const valueDropped = dropped ? ` [dropped ${sum(dropped) + modifier}]` : '';
    const isCrit = sides === 20 && baseRoll === 20;
    if (isCrit) {
      return `Crit!${valueDropped}`;
    }
    return `${value} (${count}d${sides} ${modifierSign}${modifier})${valueDropped}`;
  }
}

export function roll(count, sides, modifier, advantage = false) {
  const roll = new DiceRoll()
      .withDice(count)
      .withSides(sides)
      .withModifier(modifier)
      .withAdvantage(advantage);
  return roll;
}