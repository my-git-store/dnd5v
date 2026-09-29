type TooltipOptions = {
  text: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

export function TooltipDirective(el: HTMLElement, binding: TooltipOptions) {
    el.setAttribute('data-tooltip', binding.text);
    el.classList.add('with-tooltip');

    const position = binding.position;
    el.classList.add(`tooltip--${position}`);
}