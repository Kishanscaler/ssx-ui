import type { Samples } from './types';

/** Batch M4 (molecules M4) samples. Only the batch M4 agent edits this file. See ./index.tsx. */
const samples: Samples = {
  SearchInput: (ui) => (
    <ui.SearchInput
      aria-label="Search students"
      defaultValue="system design capstone"
      resultCount="27 of 412 students match"
    />
  ),
  DateInput: (ui) => (
    <ui.Field label="Interview date" help="Format DD/MM/YYYY.">
      <ui.DateInput
        defaultValue="2026-03-27"
        name="interview"
        trailing={<ui.DateInputButton aria-label="Change interview date" />}
      />
    </ui.Field>
  ),
  DateInputButton: 'DateInput',
  Chip: (ui) => (
    <>
      <ui.Chip defaultSelected>Hyderabad</ui.Chip>
      {/* Removable needs an onRemove handler, which cannot cross from a Server Component. */}
      <ui.Chip disabled>Live class</ui.Chip>
    </>
  ),
  // Items need their root's context.
  SegmentedControl: (ui) => (
    <ui.SegmentedControl aria-label="Filter submissions by status" defaultValue="all">
      <ui.SegmentedControlItem value="all">All</ui.SegmentedControlItem>
      <ui.SegmentedControlItem value="submitted">Submitted</ui.SegmentedControlItem>
      <ui.SegmentedControlItem value="graded" disabled>
        Graded
      </ui.SegmentedControlItem>
    </ui.SegmentedControl>
  ),
  SegmentedControlItem: 'SegmentedControl',
  ToggleButtonGroup: (ui) => (
    <>
      <ui.ToggleButtonGroup aria-label="Filter coursework by type" defaultValue={['quiz']} size="sm">
        <ui.ToggleButtonGroupItem value="assignment">Assignment</ui.ToggleButtonGroupItem>
        <ui.ToggleButtonGroupItem value="quiz">Quiz</ui.ToggleButtonGroupItem>
      </ui.ToggleButtonGroup>
      <ui.ToggleButtonGroup type="single" variant="chips" aria-label="Application stage" defaultValue="all">
        <ui.ToggleButtonGroupItem value="all">All applications</ui.ToggleButtonGroupItem>
        <ui.ToggleButtonGroupItem value="review">In review</ui.ToggleButtonGroupItem>
      </ui.ToggleButtonGroup>
    </>
  ),
  ToggleButtonGroupItem: 'ToggleButtonGroup',
};

export default samples;
