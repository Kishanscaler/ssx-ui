import type { Samples } from './types';

/**
 * Batch M2 (molecules M2) samples. Only the batch M2 agent edits this file. See ./index.tsx.
 * Everything here renders in a SERVER Component: Card and ClickableCard are
 * server components; Accordion and Tabs are client references.
 */
const samples: Samples = {
  Card: (ui) => (
    <>
      <ui.Card as="article">
        <ui.CardMedia alt="Cohort 7 orientation week" />
        <ui.CardBody>
          <ui.CardHeader>
            <ui.CardTitle>Placement drive · Nov 2026</ui.CardTitle>
          </ui.CardHeader>
          <ui.CardEyebrow>Module 06</ui.CardEyebrow>
          <ui.CardDescription>Week 6 of 12</ui.CardDescription>
        </ui.CardBody>
        <ui.CardFooter>
          <ui.Badge tone="success">Graded 92%</ui.Badge>
        </ui.CardFooter>
      </ui.Card>
      <ui.Card eyebrow="Campus life" title="Residency week" description="4–9 Aug 2026" variant="media" />
    </>
  ),
  CardBody: 'Card',
  CardDescription: 'Card',
  CardEyebrow: 'Card',
  CardFooter: 'Card',
  CardHeader: 'Card',
  CardMedia: 'Card',
  CardTitle: 'Card',
  ClickableCard: (ui) => (
    <>
      <ui.ClickableCard href="#dsa" eyebrow="Module 06" title="Data Structures & Algorithms" description="Week 6 of 12" />
      <ui.ClickableCard title="Book 1:1 with Naman Bhalla" description="Thu 12 Mar, 6:30 PM IST" />
    </>
  ),
  Accordion: (ui) => (
    <>
      <ui.Accordion defaultValue={['fees']}>
        <ui.AccordionItem value="fees">
          <ui.AccordionTrigger>What does it cost?</ui.AccordionTrigger>
          <ui.AccordionContent>₹5,50,000 per year, in two instalments.</ui.AccordionContent>
        </ui.AccordionItem>
        <ui.AccordionItem value="closed" disabled>
          <ui.AccordionTrigger>Intake closed</ui.AccordionTrigger>
          <ui.AccordionContent>Hidden.</ui.AccordionContent>
        </ui.AccordionItem>
      </ui.Accordion>
      <ui.Accordion
        type="single"
        headingLevel="h4"
        items={[
          { title: 'Is there a deferred plan?', content: 'Yes.' },
          { title: 'Can I withdraw?', content: 'Before the start date.' },
        ]}
      />
    </>
  ),
  AccordionContent: 'Accordion',
  AccordionItem: 'Accordion',
  AccordionTrigger: 'Accordion',
  Tabs: (ui) => (
    <>
      <ui.Tabs defaultValue="overview">
        <ui.TabsList aria-label="Programme details">
          <ui.TabsTrigger value="overview">Overview</ui.TabsTrigger>
          <ui.TabsTrigger value="curriculum">Curriculum</ui.TabsTrigger>
        </ui.TabsList>
        <ui.TabsContent value="overview">Four residential years.</ui.TabsContent>
        <ui.TabsContent value="curriculum">Eight semesters.</ui.TabsContent>
      </ui.Tabs>
      <ui.Tabs
        listLabel="Module workspace"
        activationMode="manual"
        items={[
          { value: 'overview', label: 'Overview', content: 'Week 6.' },
          { value: 'quizzes', label: 'Quizzes', content: 'Quiz 4 closes Friday.' },
        ]}
      />
    </>
  ),
  TabsContent: 'Tabs',
  TabsList: 'Tabs',
  TabsTrigger: 'Tabs',
};

export default samples;
