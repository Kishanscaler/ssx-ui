import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Section } from './Section';
import { Container } from '../Container';
import { Heading } from '../Heading';
import { Stack } from '../Stack';
import { Text } from '../Text';
import { Label } from '../Icon/_fixtures/story-layout';

const meta = {
  title: 'Layout/Section',
  component: Section,
  tags: ['autodocs'],
  parameters: {
    // Sections run edge to edge; the Container inside owns the gutter.
    pageLevel: true,
    docs: {
      description: {
        component: [
          'The vertical rhythm of a page: breathing room above and below one band, and nothing else.',
          'A Section never sets width, background or horizontal padding: colour goes on a full-bleed',
          'parent, the measure comes from a `Container` inside. The three densities ARE the per-surface',
          'recipes: `roomy` 96px marketing · `default` 64px student LMS · `tight` 32px admissions ops and',
          'admin. Below `sm` (672px) each drops a rung: 48 / 40 / 24px.',
        ].join('\n'),
      },
    },
  },
  args: { density: 'default' },
  argTypes: { density: { control: 'inline-radio', options: ['tight', 'default', 'roomy'] } },
} satisfies Meta<typeof Section>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A raised band inside the section, so the sunken field around it IS the section's padding. */
const Band = ({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) => (
  <Container>
    <div className="rounded-lg border border-border-decorative bg-surface p-5">
      <Stack gap="2">
        <Heading as="p" size="eyebrow">
          {eyebrow}
        </Heading>
        <Heading as="h2" size="2">
          {title}
        </Heading>
        <Text size="sm" tone="secondary">
          {children}
        </Text>
      </Stack>
    </div>
  </Container>
);

export const Playground: Story = {
  render: (args) => (
    <div className="bg-surface-sunken">
      <Section {...args}>
        <Band eyebrow="Product band" title="Term 3 modules">
          Change the density and watch the sunken field above and below this band.
        </Band>
      </Section>
    </div>
  ),
};

/** Two adjacent sections: 64px above and below each band, so the seam between them is 128px. */
export const Stacked: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="bg-surface-sunken">
      <Section>
        <Band eyebrow="Section one" title="Why SST is a four-year residential degree">
          64px sits above this band and 64px below it. The two sections are adjacent, so the seam
          between them measures 128px: the rhythm reads as one gap, not two.
        </Band>
      </Section>
      <Section>
        <Band eyebrow="Section two" title="What the Batch of 2029 curriculum covers">
          Nothing here declares a margin. Move either band to a different page and it arrives with the
          same rhythm intact.
        </Band>
      </Section>
    </div>
  ),
};

/** The three density recipes, one per surface. Narrow the canvas under 672px to see each step down. */
export const Densities: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Stack gap="8" className="py-6">
      {(
        [
          ['roomy', '96px · marketing and landing', 'Marketing band', 'A four-year residential degree in CS & AI', 'One idea per band, and enough air around it that the eye has nowhere else to go.'],
          ['default', '64px · the student LMS', 'Product band', 'Term 3 modules', 'Quiet chrome, content is the hero. Two thirds of the air of the marketing band.'],
          ['tight', '32px · admissions ops and internal consoles', 'Admin band', 'Round 2 applications', 'An operator triaging 4,318 applications needs rows on screen, not air.'],
        ] as const
      ).map(([density, label, eyebrow, title, body]) => (
        <Stack key={density} gap="2">
          <div className="px-gutter">
            <Label>{`density="${density}" · ${label}`}</Label>
          </div>
          <div className="bg-surface-sunken">
            <Section density={density}>
              <Band eyebrow={eyebrow} title={title}>
                {body}
              </Band>
            </Section>
          </div>
        </Stack>
      ))}
    </Stack>
  ),
};

/** A named region: `aria-labelledby` pointing at the section's heading makes it a landmark. */
export const LabelledRegion: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Section aria-labelledby="fees-heading">
      <Container width="narrow">
        <Stack gap="4">
          <Heading as="h2" size="2" id="fees-heading">
            Fee structure, Batch of 2029
          </Heading>
          <Text tone="secondary">
            Screen readers list this band as a region called “Fee structure, Batch of 2029”, so a
            student can jump straight to it from the landmarks menu.
          </Text>
        </Stack>
      </Container>
    </Section>
  ),
};
