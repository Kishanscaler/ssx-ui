'use client';

// Client: holds the country and the number, formats as you type, probes for
// flag-emoji support, and composes the (client) Select.
import * as React from 'react';
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/cn';
import { useComposedRefs } from '../../lib/use-composed-refs';
import { Select, SelectContent, SelectItem, SelectTrigger } from '../Select';
import { ChevronDownGlyph } from '../Select/_glyphs';
import {
  INDIA,
  phoneCountries,
  applyMask,
  caretAfterNDigits,
  digitsOnly,
  flagEmoji,
  matchDial,
  parseE164,
  toE164,
  type PhoneCountry,
} from './countries';

/* ---------------------------------------------------------------------------
 * PhoneInput
 *
 * A mobile number and its country dial code captured as ONE value, wherever
 * the number will actually be dialled or texted (guardian mobile, OTP
 * delivery). A bare text field lets the dial code live in whatever the
 * applicant felt like typing, and half the database arrives as 09845021174.
 *
 * The selector IS our Select (same trigger, same listbox, same check column,
 * same keyboard and type-ahead), not a second dropdown wearing a flag. The
 * two halves sit inside one bordered box, so hover, focus and invalid are
 * states of the GROUP; a half only takes a quiet fill to say which one the
 * pointer or the caret is in.
 *
 * Behaviour (the preview's, live): the number groups itself as you type from
 * the country's mask, with the caret held on the digit it was on; switching
 * country re-groups the digits already typed instead of clearing them; typing
 * a leading "+" parses the dial code out and moves the selector (enter
 * +971501234567 in the India field and it becomes the UAE with 50 123 4567).
 * Digits past the country's maximum are dropped.
 *
 * Value: E.164 (`+919845021174`, or '' when empty) through `value` /
 * `onValueChange`, which also receives `{ country, national, e164 }`. With
 * `name`, a hidden input submits the E.164 string under that name.
 *
 * Flags are decoration, never the only carrier: Windows has no flag glyphs
 * (Segoe UI Emoji draws "IN" as two letters), so `flag="auto"` probes the
 * platform once and falls back to an ISO chip. The dial code is visible text
 * either way and the trigger is named in words ("Country dial code: +91
 * India"); the flag and chip are aria-hidden.
 *
 * Where the props go: `className` and the size on the ROOT group; every other
 * native attribute, `id`, `aria-*` and the ref on the tel <input>.
 * ------------------------------------------------------------------------- */

export const phoneInputVariants = cva(
  [
    'flex w-full min-w-0 items-stretch',
    'rounded-md border border-field-border bg-field font-sans text-field-content',
    'transition-[border-color,background-color,box-shadow] duration-[var(--motion-duration-instant)]',
    'ease-productive-in-out motion-reduce:transition-none',
    '[&:not([data-disabled])]:hover:border-field-border-hover',
    // One ring, on the group, in the Input contract. Two nested rings would
    // read as two controls, which is the thing this component exists to deny.
    'focus-within:border-border-focus focus-within:ring-[3px] focus-within:ring-border-focus/50',
    'data-[invalid]:border-danger data-[invalid]:ring-danger/20',
    'data-[disabled]:cursor-not-allowed data-[disabled]:bg-field-disabled data-[disabled]:text-content-disabled',
    'data-[readonly]:border-dashed data-[readonly]:bg-surface-sunken',
  ],
  {
    variants: {
      size: {
        sm: 'h-control-sm text-sm',
        md: 'h-control-md text-base',
        lg: 'h-control-lg text-md',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

type PhoneInputVariantProps = VariantProps<typeof phoneInputVariants>;

/** String unions, so a Storyblok option value can be passed straight in. */
export type PhoneInputSize = NonNullable<PhoneInputVariantProps['size']>;
export type PhoneInputFlag = 'auto' | 'emoji' | 'iso';

export type PhoneInputValueDetails = {
  /** ISO code of the selected country. */
  country: string;
  /** National digits only, no formatting. */
  national: string;
  /** `+<dial><national>`, or '' when there is no number. */
  e164: string;
};

export type PhoneInputProps = Omit<
  React.ComponentPropsWithoutRef<'input'>,
  'size' | 'type' | 'value' | 'defaultValue'
> & {
  /** The number in E.164 (controlled). '' is empty. */
  value?: string;
  /**
   * The initial number in E.164 (uncontrolled). Its dial code also picks the
   * country.
   *
   * @default ''
   */
  defaultValue?: string;
  /** Called with the E.164 string ('' when empty) and its parts. */
  onValueChange?: (value: string, details: PhoneInputValueDetails) => void;
  /** Selected country ISO code (controlled). */
  country?: string;
  /**
   * Initial country ISO code (uncontrolled).
   *
   * @default 'IN'
   */
  defaultCountry?: string;
  /** Called with the ISO code when the country changes (picked, or parsed from a typed "+"). */
  onCountryChange?: (iso: string) => void;
  /**
   * The country table: `{ iso, name, dial, mask, max, example }`.
   *
   * @default phoneCountries (IN, US, AE, SG, GB, AU)
   */
  countries?: readonly PhoneCountry[];
  /**
   * Control height and type size: 32 / 40 / 48px.
   *
   * @default 'md'
   */
  size?: PhoneInputSize;
  /**
   * `auto` shows the flag emoji where the platform draws one and an ISO chip
   * elsewhere (Windows); `emoji` / `iso` pin one.
   *
   * @default 'auto'
   */
  flag?: PhoneInputFlag;
  /**
   * The words that open the trigger's accessible name, which reads
   * "Country dial code: +91 India".
   *
   * @default 'Country dial code'
   */
  countryLabel?: string;
};

/* ---- flag-emoji support probe (once per page) ---------------------------- */

let flagSupport: boolean | undefined;

/**
 * A flag emoji is two regional-indicator letters the FONT must draw as one
 * coloured glyph. Probe 1: does the pair collapse to one glyph's width?
 * Probe 2: is what it drew actually coloured? Either failing means ISO chips.
 * jsdom has no canvas (and would log about it), so it is assumed supported.
 */
function probeFlagEmoji(): boolean {
  if (flagSupport !== undefined) return flagSupport;
  try {
    if (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)) {
      flagSupport = true;
      return flagSupport;
    }
    const canvas = document.createElement('canvas');
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext('2d', { willReadFrequently: true } as CanvasRenderingContext2DSettings);
    if (!ctx) {
      flagSupport = false;
      return flagSupport;
    }
    ctx.font = '32px sans-serif';
    ctx.textBaseline = 'top';
    const single = ctx.measureText('\u{1F1EE}').width;
    const pair = ctx.measureText('\u{1F1EE}\u{1F1F3}').width;
    if (!single || pair > single * 1.5) {
      flagSupport = false;
      return flagSupport;
    }
    ctx.clearRect(0, 0, 48, 48);
    ctx.fillText('\u{1F1EE}\u{1F1F3}', 0, 4);
    const data = ctx.getImageData(0, 0, 48, 48).data;
    flagSupport = false;
    for (let i = 0; i < data.length; i += 4) {
      const [r = 0, g = 0, b = 0, a = 0] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
      if (a < 128) continue;
      if (Math.max(r, g, b) - Math.min(r, g, b) > 24) {
        flagSupport = true;
        break;
      }
    }
  } catch {
    flagSupport = false;
  }
  return flagSupport;
}

/** Emoji first (server and first client render agree), then the probe decides. */
function useFlagMode(flag: PhoneInputFlag): 'emoji' | 'iso' {
  const [supported, setSupported] = React.useState(true);
  React.useEffect(() => {
    if (flag === 'auto') setSupported(probeFlagEmoji());
  }, [flag]);
  if (flag === 'emoji') return 'emoji';
  if (flag === 'iso') return 'iso';
  return supported ? 'emoji' : 'iso';
}

function PhoneFlag({ iso, mode }: { iso: string; mode: 'emoji' | 'iso' }) {
  return (
    <span
      data-slot="phone-input-flag"
      data-mode={mode}
      aria-hidden="true"
      className="inline-flex shrink-0 items-center leading-none"
    >
      {mode === 'emoji' ? (
        <span className="text-lg leading-none">{flagEmoji(iso)}</span>
      ) : (
        <span
          className={cn(
            'inline-flex h-[18px] min-w-[26px] items-center justify-center rounded-sm px-1',
            'bg-surface-sunken text-xs font-bold leading-none tracking-wide text-content-secondary',
            'group-data-[state=checked]/select-item:bg-surface-brand-subtle',
            'group-data-[state=checked]/select-item:text-content-brand',
          )}
        >
          {iso}
        </span>
      )}
    </span>
  );
}

/* ---- component ----------------------------------------------------------- */

const useIsoLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(function PhoneInput(
  {
    className,
    size = 'md',
    value: valueProp,
    defaultValue = '',
    onValueChange,
    country: countryProp,
    defaultCountry = 'IN',
    onCountryChange,
    countries = phoneCountries,
    flag = 'auto',
    countryLabel = 'Country dial code',
    disabled,
    readOnly,
    name,
    placeholder,
    onChange,
    ...props
  },
  forwardedRef,
) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const ref = useComposedRefs(forwardedRef, inputRef);
  const flagMode = useFlagMode(flag);

  const byIso = (iso: string | undefined) =>
    countries.find((c) => c.iso === (iso || '').toUpperCase());

  const [countryIso, setCountryIso] = useControllableState<string>({
    prop: countryProp,
    defaultProp: parseE164(valueProp ?? defaultValue, countries, defaultCountry)?.country.iso ?? defaultCountry,
    onChange: onCountryChange,
    caller: 'PhoneInput',
  });
  const [value, setValue] = useControllableState<string>({
    prop: valueProp,
    defaultProp: defaultValue,
    caller: 'PhoneInput',
  });

  const country: PhoneCountry = byIso(countryIso) ?? countries[0] ?? INDIA;
  // Read the value under the selected country when its dial code fits (so a
  // national number that happens to start like another code stays put), else
  // find the country it belongs to.
  const valueDigits = digitsOnly(value);
  const ownDial = digitsOnly(country.dial);
  const parsed =
    valueDigits && ownDial && valueDigits.startsWith(ownDial)
      ? { country, national: valueDigits.slice(ownDial.length).slice(0, country.max) }
      : parseE164(value, countries, country.iso);
  const national = parsed?.national ?? '';

  // A value from outside (controlled, or a default) with another country's
  // dial code moves the selector to match.
  React.useEffect(() => {
    if (parsed && parsed.country.dial !== country.dial) setCountryIso(parsed.country.iso);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // "+9" typed but not yet a known dial code: shown as typed, not masked.
  const [plusDraft, setPlusDraft] = React.useState<string | null>(null);
  const text = plusDraft ?? applyMask(national, country.mask);

  // Caret: held on the digit it was on, re-applied after the formatted render.
  const [caret, setCaret] = React.useState<{ digits: number; nonce: number } | null>(null);
  useIsoLayoutEffect(() => {
    const el = inputRef.current;
    if (!caret || !el || el.ownerDocument.activeElement !== el) return;
    const at = caret.digits < 0 ? text.length : caretAfterNDigits(text, caret.digits);
    try {
      el.setSelectionRange(at, at);
    } catch {
      /* detached or hidden */
    }
  }, [caret]);

  const emit = (next: PhoneCountry, nextNational: string) => {
    const e164 = toE164(next, nextNational);
    if (e164 !== value) setValue(e164);
    // Called on every edit, even when the E.164 string is unchanged by it
    // (a regroup), so a consumer can mirror the parts.
    onValueChange?.(e164, { country: next.iso, national: nextNational, e164 });
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(event);
    const raw = event.target.value;
    const pos = event.target.selectionStart;
    let before = pos == null ? -1 : digitsOnly(raw.slice(0, pos)).length;
    let digits = digitsOnly(raw);
    let next = country;

    if (raw.trim().charAt(0) === '+') {
      const hit = matchDial(digits, countries, country.iso);
      if (!hit) {
        // Still mid-dial-code: leave it alone rather than masking a partial
        // country code into a national number that is not one.
        setPlusDraft(`+${digits}`);
        if (value) emit(country, '');
        return;
      }
      next = hit;
      digits = digits.slice(digitsOnly(hit.dial).length);
      before = -1; // the whole string changed shape: caret to the end
      if (hit.iso !== country.iso) setCountryIso(hit.iso);
    }

    setPlusDraft(null);
    const nextNational = digits.slice(0, next.max);
    emit(next, nextNational);
    setCaret({ digits: before < 0 ? -1 : Math.min(before, nextNational.length), nonce: (caret?.nonce ?? 0) + 1 });
  };

  const handleCountry = (iso: string) => {
    const next = byIso(iso);
    if (!next) return;
    setCountryIso(next.iso);
    setPlusDraft(null);
    // The number did not change, only the way it is written down: re-group
    // the digits already typed instead of clearing them.
    const nextNational = national.slice(0, next.max);
    emit(next, nextNational);
  };

  const invalid = props['aria-invalid'] === true || props['aria-invalid'] === 'true';

  return (
    <div
      data-slot="phone-input"
      data-size={size}
      data-invalid={invalid ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
      data-readonly={readOnly && !disabled ? '' : undefined}
      className={cn(phoneInputVariants({ size }), className)}
    >
      {/* Read-only keeps the trigger legible and focusable but never opens it;
          disabled greys the whole group. */}
      <Select
        value={country.iso}
        onValueChange={handleCountry}
        disabled={disabled}
        open={readOnly ? false : undefined}
      >
        <SelectTrigger
          data-slot="phone-input-country"
          size={size}
          // Named in words, explicitly: a combobox does not take its name from
          // its contents, so the flag / dial text alone would leave it unnamed.
          aria-label={`${countryLabel}: ${country.dial} ${country.name}`}
          icon={<ChevronDownGlyph className="size-icon-sm text-content-secondary in-disabled:text-content-disabled" />}
          className={cn(
            // Keep the Select trigger's layout and type; lose its box. The
            // group owns the border and the ring; the seam stays.
            'h-full w-auto shrink-0 gap-2 pr-2 pl-3 whitespace-nowrap',
            'rounded-none rounded-l-md border-0 border-r border-border-control bg-transparent',
            'enabled:hover:border-border-control enabled:hover:bg-field-hover',
            'enabled:active:border-border-control enabled:active:bg-surface-active',
            'data-[state=open]:border-border-control data-[state=open]:bg-surface-active',
            'focus-visible:border-border-control focus-visible:bg-field-hover focus-visible:ring-0',
            'disabled:border-border-control disabled:bg-transparent',
          )}
        >
          <PhoneFlag iso={country.iso} mode={flagMode} />
          <span data-slot="phone-input-dial" className="font-semibold tabular-nums">
            {country.dial}
          </span>
        </SelectTrigger>
        <SelectContent aria-label={countryLabel} className="min-w-80">
          {countries.map((c) => (
            <SelectItem key={c.iso} value={c.iso} textValue={c.name}>
              <PhoneFlag iso={c.iso} mode={flagMode} />
              <span className="whitespace-nowrap">{c.name}</span>
              <span
                className={cn(
                  'ms-auto ps-4 tabular-nums text-content-secondary',
                  'group-data-[state=checked]/select-item:text-content-brand',
                  'group-data-[disabled]/select-item:text-content-disabled',
                )}
              >
                {c.dial}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <input
        ref={ref}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        data-slot="phone-input-number"
        value={text}
        placeholder={placeholder ?? country.example}
        disabled={disabled}
        readOnly={readOnly}
        className={cn(
          'h-full min-w-0 flex-1 rounded-r-md border-0 bg-transparent px-3',
          'font-sans tabular-nums text-inherit outline-none',
          'placeholder:text-field-placeholder',
          'selection:bg-action-primary selection:text-action-primary-fg',
          'disabled:cursor-not-allowed disabled:text-content-disabled',
        )}
        onChange={handleChange}
        {...props}
      />
      {name ? (
        <input type="hidden" data-slot="phone-input-value" name={name} value={value} />
      ) : null}
    </div>
  );
});
PhoneInput.displayName = 'PhoneInput';
