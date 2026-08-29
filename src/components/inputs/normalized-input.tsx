import { forwardRef, useRef, type InputHTMLAttributes, type Ref } from 'react';

type NormalizedInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  value: string;
  normalize: (value: string) => string;
  onValueChange: (value: string) => void;
};

/**
 * A controlled input which is safe with mobile IME editing buffers.
 *
 * Mobile keyboards often replace an earlier composition (W -> W4 -> W4LM).
 * Rewriting the value while that buffer is active can make the IME append every
 * intermediate string instead. Keep the DOM untouched during composition, then
 * normalize and commit the final value when composition ends.
 */
export const NormalizedInput = forwardRef(function NormalizedInput({
  value,
  normalize,
  onValueChange,
  ...props
}: NormalizedInputProps, ref: Ref<HTMLInputElement>) {
  const composingRef = useRef(false);

  const commit = (rawValue: string) => onValueChange(normalize(rawValue));

  const commitComposition = (rawValue: string) => {
    if (!composingRef.current) return;
    composingRef.current = false;
    commit(rawValue);
  };

  return (
    <input
      {...props}
      ref={ref}
      value={value}
      onChange={(event) => {
        if (composingRef.current) return;

        // Some Android keyboards and CDP/IME text insertion report a complete
        // replacement (for example W4) as insertText after a shorter prefix (W).
        // Detect that case so the controlled value is replaced rather than
        // accumulating W + W4 + W4L + W4LM. Ordinary single-character input and
        // paste are not affected.
        const nativeEvent = event.nativeEvent as InputEvent;
        const data = typeof nativeEvent.data === 'string' ? nativeEvent.data : '';
        const candidate = normalize(data);
        const targetValue = normalize(event.currentTarget.value);
        const replacingImeText = (
          data.length > 1 &&
          value.length > 0 &&
          candidate.startsWith(value) &&
          targetValue.endsWith(candidate) &&
          (nativeEvent.inputType === 'insertText' || nativeEvent.inputType === 'insertCompositionText')
        );
        if (replacingImeText) onValueChange(candidate);
        else commit(event.currentTarget.value);
      }}
      onCompositionStart={() => {
        composingRef.current = true;
      }}
      onCompositionEnd={(event) => {
        composingRef.current = false;
        commit(event.currentTarget.value);
      }}
      onBlur={(event) => {
        commitComposition(event.currentTarget.value);
        props.onBlur?.(event);
      }}
    />
  );
});
NormalizedInput.displayName = 'NormalizedInput';
