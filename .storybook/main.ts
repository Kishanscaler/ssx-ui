import type { StorybookConfig } from '@storybook/react-vite';

/** DOM attributes listed in the props tables (see `propFilter` below). */
const HTML_PROPS = new Set(['disabled', 'required', 'readOnly', 'placeholder', 'name']);

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-docs',
    // Every story is an accessibility check. This is a system whose contrast
    // is gated in the Python build; the React half needs the same pressure.
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  typescript: {
    // The props table in Autodocs is generated from the TSDoc on ButtonProps,
    // so the docs cannot drift from the types.
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      // Name each export by its export name. Without this, react-docgen-typescript
      // can hand a file's `.displayName` string to the cva recipe exported next to
      // the component (`checkboxVariants` -> "Checkbox"), then drop the real
      // component as a duplicate. That emptied the props tables of Checkbox,
      // Heading, Icon and Link (they showed only the recipe's `class`/`className`).
      componentNameResolver: (exp) => {
        const name = exp.getName();
        return name === 'default' || name === '__function' ? undefined : name;
      },
      propFilter: (prop, component) => {
        if (!prop.parent) return true;
        const file = prop.parent.fileName;
        if (!/node_modules/.test(file)) return true;
        // Props declared by the primitives we wrap ARE our API: `pressed` on
        // ToggleButton, `checked` / `onCheckedChange` on Checkbox and Switch,
        // `value` / `onValueChange` / `orientation` on RadioGroup, Select, Slider.
        if (/node_modules\/(@radix-ui|input-otp)\//.test(file)) return true;
        // From the ~280 DOM attributes, keep only the ones a consumer (or a CMS
        // field) actually sets on an atom. Anything else still works; it is just
        // not listed.
        // (Icon's SVG `name` attribute is skipped: it reads as "icon name".)
        if (HTML_PROPS.has(prop.name)) return component.name !== 'Icon';
        return component.name === 'Link' && (prop.name === 'href' || prop.name === 'target');
      },
    },
  },
};

export default config;
