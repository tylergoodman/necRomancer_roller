const ROOT = document.querySelector('body');

export function makeNumberInput(options) {
  const root = document.createElement('div');
  root.classList.add('roll-section');
  if (options.subInput) {
    root.classList.add('roll-section-sub');
  }
  root.innerHTML = `
    <div class="label">${options.label}</div>
    <div class="number">${options.value}</div>
    <button class="incrementor">^</button>
    <button class="decrementor">⌄</button>`;
  const number = root.querySelector('.number');
  const incrementor = root.querySelector('.incrementor');
  const decrementor = root.querySelector('.decrementor');
  let value = options.value;
  const changeHandler = delta => () => {
    value = value + delta;
    number.innerText = value;
    options.onChange(value);
  };
  incrementor.addEventListener('click', changeHandler(1));
  decrementor.addEventListener('click', changeHandler(-1));
  ROOT.append(root);
  return root;
}

export function makeButton(options, append = true) {
  const root = document.createElement('button');
  root.classList.add('roll-button');
  root.innerHTML = options.label;
  root.addEventListener('click', options.onClick);
  if (append) {
    ROOT.append(root);
  }
  return root;
}

export function showRollsDialog(options) {
  const sectionsHtmlCollector = [];
  for (const section of options.sections) {
    sectionsHtmlCollector.push(`
      <div class="roll-dialog-section">
        <h3>${section.label}</h3>
        <ol>
          ${section.rolls.map(roll => `<li><b>${roll.toHit}</b> to hit,</br><b>${roll.damage}</b> damage</li>`).join('')}
        </ol>
      </div>`);
  }
  const root = document.createElement('div');
  root.classList.add('dialog');
  root.innerHTML = `
      ${sectionsHtmlCollector.join('')}
    `;
  root.append(makeButton({
    label: 'Close',
    onClick: () => root.remove(),
  }));
  ROOT.append(root);
  return root;
}
