/**
 * @kishanscaler/ssx-ui — public surface.
 *
 * One barrel, one place to see what is actually shipped. A component that is
 * not exported here does not exist as far as a consumer is concerned, which is
 * how the registry stays an allowlist rather than a description.
 *
 * Re-exports ONLY. No directive, no code: marking this file "use client" would
 * turn every server atom into a client reference (scripts/check-directives.mjs
 * fails the build if it happens).
 *
 * PARALLEL WORK. Atoms are being built by three agents at once. Each one
 * appends ONLY inside its own batch section below and never edits another
 * section, the core section, or these comments, so no two agents touch the
 * same lines. The same split exists in:
 *   scripts/client-manifest/batch-*.mjs            the "use client" manifest
 *   examples/webpack4-react16/src/samples/batch-*.js   legacy smoke samples
 *   examples/next-smoke/app/samples/batch-*.tsx        Next smoke samples
 * Every PascalCase export here is rendered by BOTH smoke fixtures
 * automatically; a batch sample file is only needed for an export that cannot
 * render with no props (a compound part, a required prop).
 */

/* ---------- core atoms (done; do not edit from a batch) -------------------- */
export { Button, buttonVariants } from './components/Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './components/Button';

export { Input, inputVariants } from './components/Input';
export type { InputProps, InputSize } from './components/Input';

export { Spinner, spinnerVariants } from './components/Spinner';
export type { SpinnerKind, SpinnerProps, SpinnerSize } from './components/Spinner';

/* ---------- batch A -------------------------------------------------------- */
/* batch A: append exports below this line, above the batch B marker. */
export { IconButton } from './components/IconButton';
export type { IconButtonProps, IconButtonSize } from './components/IconButton';

export { Link, linkVariants } from './components/Link';
export type { LinkProps, LinkVariant } from './components/Link';

export { Text, textVariants } from './components/Text';
export type { TextProps, TextTone, TextSize, TextElement } from './components/Text';

export { Heading, headingVariants } from './components/Heading';
export type { HeadingProps, HeadingSize, HeadingElement } from './components/Heading';

export { Icon, iconVariants } from './components/Icon';
export type { IconProps, IconSize, IconTone } from './components/Icon';

export { Badge, badgeVariants } from './components/Badge';
export type { BadgeProps, BadgeTone, BadgeSize } from './components/Badge';

export { StatusDot, statusDotVariants } from './components/StatusDot';
export type { StatusDotProps, StatusDotTone, StatusDotSize } from './components/StatusDot';

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarBadge,
  AvatarGroup,
  AvatarGroupCount,
  avatarVariants,
} from './components/Avatar';
export type {
  AvatarProps,
  AvatarImageProps,
  AvatarFallbackProps,
  AvatarBadgeProps,
  AvatarGroupProps,
  AvatarGroupCountProps,
  AvatarSize,
} from './components/Avatar';

export { Divider, dividerVariants } from './components/Divider';
export type { DividerProps, DividerOrientation } from './components/Divider';

export { Skeleton, skeletonVariants } from './components/Skeleton';
export type { SkeletonProps, SkeletonShape, SkeletonSize } from './components/Skeleton';

export { Kbd, KbdGroup, KbdMod } from './components/Kbd';
export type { KbdProps, KbdGroupProps, KbdModProps, KbdModifier, KbdPlatform } from './components/Kbd';

export {
  Code,
  CodeBlock,
  CodeBlockHeader,
  CodeBlockGroup,
  CodeToken,
  CopyButton,
  codeVariants,
  codeTokenVariants,
} from './components/Code';
export type {
  CodeProps,
  CodeTone,
  CodeBlockProps,
  CodeBlockHeaderProps,
  CodeBlockGroupProps,
  CodeTokenProps,
  CodeTokenKind,
  CopyButtonProps,
} from './components/Code';

/* ---------- batch B -------------------------------------------------------- */
/* batch B: append exports below this line, above the batch C marker. */
export { Checkbox, checkboxVariants } from './components/Checkbox';
export type { CheckboxProps } from './components/Checkbox';

export {
  RadioGroup,
  RadioGroupItem,
  radioGroupVariants,
  radioGroupItemVariants,
} from './components/RadioGroup';
export type { RadioGroupProps, RadioGroupItemProps } from './components/RadioGroup';

export { Switch, SwitchStatus, switchVariants } from './components/Switch';
export type { SwitchProps, SwitchStatusProps } from './components/Switch';

export { ToggleButton, toggleButtonVariants } from './components/ToggleButton';
export type { ToggleButtonProps, ToggleButtonSize } from './components/ToggleButton';

export { Slider, sliderVariants } from './components/Slider';
export type { SliderProps, SliderTooltip } from './components/Slider';

export { ProgressBar, progressBarVariants } from './components/ProgressBar';
export type { ProgressBarProps, ProgressBarState } from './components/ProgressBar';

/* ---------- batch C -------------------------------------------------------- */
/* batch C: append exports below this line, above the utilities marker. */
export { Textarea, textareaVariants } from './components/Textarea';
export type { TextareaProps, TextareaSize } from './components/Textarea';

export { NumberInput, numberInputVariants } from './components/NumberInput';
export type { NumberInputProps, NumberInputSize } from './components/NumberInput';

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  selectTriggerVariants,
} from './components/Select';
export type {
  SelectContentProps,
  SelectGroupProps,
  SelectItemProps,
  SelectLabelProps,
  SelectProps,
  SelectScrollDownButtonProps,
  SelectScrollUpButtonProps,
  SelectSeparatorProps,
  SelectSize,
  SelectTriggerProps,
  SelectValueProps,
} from './components/Select';

export { OtpInput, OtpInputGroup, OtpInputSlot } from './components/OtpInput';
export type { OtpInputGroupProps, OtpInputProps, OtpInputSlotProps } from './components/OtpInput';

export { PhoneInput, phoneInputVariants, phoneCountries } from './components/PhoneInput';
export type {
  PhoneCountry,
  PhoneInputFlag,
  PhoneInputProps,
  PhoneInputSize,
  PhoneInputValueDetails,
} from './components/PhoneInput';

/* ---------- batch M1 (molecules M1) ---------------------------------------- */
/* batch M1: append exports below this line, above the next marker. */
export {
  Field,
  FieldLabel,
  FieldControl,
  FieldHelp,
  FieldError,
  FieldContent,
  FieldSet,
  FieldLegend,
  fieldVariants,
  useField,
} from './components/Field';
export type {
  FieldProps,
  FieldOrientation,
  FieldLabelProps,
  FieldControlProps,
  FieldHelpProps,
  FieldErrorProps,
  FieldContentProps,
  FieldSetProps,
  FieldSetVariant,
  FieldLegendProps,
} from './components/Field';

export { ButtonGroup, buttonGroupVariants } from './components/ButtonGroup';
export type { ButtonGroupProps } from './components/ButtonGroup';

export {
  Menu,
  MenuTrigger,
  MenuContent,
  MenuItem,
  MenuCheckboxItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuGroup,
  MenuLabel,
  MenuSeparator,
  menuItemVariants,
} from './components/Menu';
export type {
  MenuProps,
  MenuTriggerProps,
  MenuContentProps,
  MenuItemProps,
  MenuItemVariant,
  MenuCheckboxItemProps,
  MenuRadioGroupProps,
  MenuRadioItemProps,
  MenuGroupProps,
  MenuLabelProps,
  MenuSeparatorProps,
} from './components/Menu';

/* ---------- batch M2 (molecules M2) ---------------------------------------- */
/* batch M2: append exports below this line, above the next marker. */
export {
  Card,
  CardBody,
  CardDescription,
  CardEyebrow,
  CardFooter,
  CardHeader,
  CardMedia,
  CardTitle,
  cardVariants,
} from './components/Card';
export type {
  CardBodyProps,
  CardContentFields,
  CardDescriptionProps,
  CardElement,
  CardEyebrowProps,
  CardFooterProps,
  CardHeaderProps,
  CardMediaProps,
  CardMediaRatio,
  CardProps,
  CardTitleProps,
  CardVariant,
} from './components/Card';

export { ClickableCard, clickableCardVariants } from './components/ClickableCard';
export type { ClickableCardProps } from './components/ClickableCard';

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './components/Accordion';
export type {
  AccordionContentProps,
  AccordionHeadingLevel,
  AccordionItemData,
  AccordionItemProps,
  AccordionProps,
  AccordionTriggerProps,
  AccordionType,
} from './components/Accordion';

export { Tabs, TabsContent, TabsList, TabsTrigger } from './components/Tabs';
export type {
  TabsActivationMode,
  TabsContentProps,
  TabsItemData,
  TabsListProps,
  TabsOrientation,
  TabsProps,
  TabsTriggerProps,
} from './components/Tabs';

/* ---------- batch O1 (organisms O1) ---------------------------------------- */
/* batch O1: append exports below this line, above the next marker. */
export {
  TopNav,
  TopNavBrand,
  TopNavLinks,
  TopNavLink,
  TopNavMenu,
  TopNavActions,
  TopNavToggle,
  topNavVariants,
  topNavLinkVariants,
} from './components/TopNav';
export type {
  TopNavProps,
  TopNavBrandProps,
  TopNavLinksProps,
  TopNavLinkProps,
  TopNavMenuProps,
  TopNavActionsProps,
  TopNavToggleProps,
  TopNavLinkData,
  TopNavActionData,
  TopNavSize,
  TopNavCollapse,
  TopNavActionsOnMobile,
} from './components/TopNav';
export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogClose,
  dialogContentVariants,
} from './components/Dialog';
export type {
  DialogProps,
  DialogTriggerProps,
  DialogContentProps,
  DialogHeaderProps,
  DialogTitleProps,
  DialogDescriptionProps,
  DialogBodyProps,
  DialogFooterProps,
  DialogCloseProps,
  DialogVariant,
} from './components/Dialog';
export {
  Carousel,
  CarouselTrack,
  CarouselSlide,
  CarouselPrevious,
  CarouselNext,
  CarouselDots,
  carouselVariants,
} from './components/Carousel';
export type {
  CarouselProps,
  CarouselTrackProps,
  CarouselSlideProps,
  CarouselItemData,
  CarouselPerView,
  CarouselButtonProps,
  CarouselButtonPlacement,
  CarouselDotsProps,
} from './components/Carousel';

/* ---------- brand (Logo) --------------------------------------------------- */
export { Logo, LogoLoader, logoVariants, logoBrandNames } from './components/Logo';
export type {
  LogoProps,
  LogoLoaderProps,
  LogoBrand,
  LogoVariant,
  LogoTone,
  LogoSurface,
  LogoSize,
  LogoLoaderSize,
} from './components/Logo';

/* ---------- per-batch barrels (each batch edits only its own file) ---------- */
export * from './batches/m3';
export * from './batches/m4';
export * from './batches/m5';
export * from './batches/m6';
export * from './batches/o2';
export * from './batches/o3';
export * from './batches/o4';

/* ---------- utilities ------------------------------------------------------ */
export { cn } from './lib/cn';
