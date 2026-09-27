import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Container, ContainerBleed } from './Container';
import { AspectRatio, AspectRatioFill } from '../AspectRatio';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Heading } from '../Heading';
import { Section } from '../Section';
import { Stack } from '../Stack';
import { Text } from '../Text';
import { Label } from '../Icon/_fixtures/story-layout';

const meta = {
  title: 'Layout/Container',
  component: Container,
  subcomponents: { ContainerBleed } as Record<string, React.ComponentType<unknown>>,
  tags: ['autodocs'],
  parameters: {
    // A Container owns the page edge: the canvas adds no padding, so the
    // gutter on show is the Container's own (16px phone, 24px from sm).
    pageLevel: true,
    docs: {
      description: {
        component: [
          'The horizontal counterpart to Section: it caps the measure, centres it, and holds the page',
          'gutter (`px-gutter`: 16px on a phone, 24px from `sm`). No vertical padding (pair it with',
          'Section) and it **never paints**: colour the full-bleed parent and put the Container inside.',
          'Widths: `narrow` 68ch prose · `default` 1280px · `wide` 1584px dashboards. `ContainerBleed` is',
          'one child that escapes to the viewport width; it is for centred marketing pages, not app shells.',
        ].join('\n'),
      },
    },
  },
  args: { width: 'default' },
  argTypes: { width: { control: 'inline-radio', options: ['narrow', 'default', 'wide'] } },
} satisfies Meta<typeof Container>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div className="bg-surface-sunken py-6">
      <Container {...args}>
        <div className="rounded-lg bg-surface-brand-subtle p-5">
          <Text size="sm" tone="secondary">
            The tinted block is the Container&apos;s content box. The sunken strip either side is the gutter,
            and past the max width, the centring margin.
          </Text>
        </div>
      </Container>
    </div>
  ),
};

/** The gutter: the band stops short of the full-bleed parent on both sides. That strip is `px-gutter`. */
export const Gutter: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="bg-surface-sunken py-6">
      <Container>
        <div className="bg-surface-brand-subtle p-5">
          <Stack gap="2">
            <Heading as="p" size="eyebrow">
              Container content
            </Heading>
            <Text size="sm" tone="secondary">
              The coloured band stops 16px short of the parent on a phone and 24px from 672px. That strip
              is the only reason body copy is readable on a 320px screen.
            </Text>
          </Stack>
        </div>
      </Container>
    </div>
  ),
};

/** The canonical page recipe: full-bleed background › Section (rhythm) › Container (measure). */
export const PageRecipe: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="bg-surface-brand-subtle">
      <Section>
        <Container>
          <Stack gap="6">
            <Stack gap="2">
              <Heading as="p" size="eyebrow">
                Admissions · Batch of 2029
              </Heading>
              <Heading as="h1" size="1">
                Applications close 28 Feb 2026
              </Heading>
              <Text tone="secondary">
                The tinted band runs edge to edge. The heading does not: it stops where the container
                stops. Separating those two jobs is the point of Container being its own primitive.
              </Text>
            </Stack>
            <Stack direction="horizontal" wrap>
              <Button>Start application</Button>
              <Button variant="tertiary">Download brochure</Button>
            </Stack>
          </Stack>
        </Container>
      </Section>
    </div>
  ),
};

/** `narrow` holds prose at 68ch; `wide` gives a dashboard the 1584px a nine-column table needs. */
export const Widths: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Stack gap="8" className="py-6">
      <Stack gap="2">
        <div className="px-gutter">
          <Label>width=&quot;narrow&quot; · 68ch · the prose measure</Label>
        </div>
        <div className="bg-surface-sunken py-4">
          <Container width="narrow">
            <div className="bg-surface p-5">
              <Stack gap="2">
                <Heading as="p" size="eyebrow">
                  SSB case study · Term 2
                </Heading>
                <Text tone="secondary">
                  Sixty-eight characters is not a taste call. It is roughly the line length at which the eye
                  can find the start of the next line without the head moving, and long-form admissions copy
                  (fee structures, scholarship criteria, the academic-integrity policy) gets read start to
                  finish or it gets misread.
                </Text>
              </Stack>
            </div>
          </Container>
        </div>
      </Stack>
      <Stack gap="2">
        <div className="px-gutter">
          <Label>width=&quot;default&quot; · 1280px</Label>
        </div>
        <div className="bg-surface-sunken py-4">
          <Container>
            <div className="bg-surface-brand-subtle p-5">
              <Text size="sm" tone="secondary">
                The system default: marketing pages and the student LMS.
              </Text>
            </div>
          </Container>
        </div>
      </Stack>
      <Stack gap="2">
        <div className="px-gutter">
          <Label>width=&quot;wide&quot; · 1584px · dashboards and wide tables</Label>
        </div>
        <div className="bg-surface-sunken py-4">
          <Container width="wide">
            <div className="bg-surface-brand-subtle p-5">
              <Stack gap="2">
                <Heading as="p" size="eyebrow">
                  Admissions ops console
                </Heading>
                <Text size="sm" tone="secondary">
                  A nine-column applicant table has no reading measure to protect. Capping it at 1280px on
                  a 1584px monitor throws away three columns of usable width.
                </Text>
              </Stack>
            </div>
          </Container>
        </div>
      </Stack>
    </Stack>
  ),
};

/** `ContainerBleed`: one child escapes to the viewport width; its siblings stay on the measure. */
export const Bleed: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    // The page root clips x-overflow, as a real page should: `vw` counts a
    // classic scrollbar, so the bleed can be that much wider than the page.
    <div className="overflow-x-clip bg-surface-sunken py-6">
      <Container width="narrow">
        <Stack>
          <Text tone="secondary">This paragraph is held at the 68ch measure by its container.</Text>
          <ContainerBleed asChild>
            <AspectRatio ratio="21:9" className="rounded-none bg-surface-brand-subtle">
              <AspectRatioFill className="gap-2 p-5">
                <Badge>ContainerBleed</Badge>
                <Text size="sm" tone="secondary" className="text-center">
                  A campus panorama runs edge to edge, without the container losing its grip on the text
                  above and below.
                </Text>
              </AspectRatioFill>
            </AspectRatio>
          </ContainerBleed>
          <Text tone="secondary">
            And this one is back on the measure, because the bleed is a property of the one child that
            needs it, not of the container.
          </Text>
        </Stack>
      </Container>
    </div>
  ),
};
