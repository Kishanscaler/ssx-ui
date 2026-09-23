import * as React from 'react';

/**
 * Batch A samples. Only the batch A agent edits this file. See ./index.js.
 *
 *   Checkbox: (ui) => <ui.Checkbox aria-label="Accept terms" />,
 *   SelectItem: 'Select',  // rendered inside the Select sample
 */

/** A plain inline svg: the package is icon-library agnostic. */
const glyph = (
  <svg viewBox="0 0 256 256">
    <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z" />
  </svg>
);

export default {
  Icon: (ui) => (
    <>
      <ui.Icon>{glyph}</ui.Icon>
      <ui.Icon size="sm" tone="brand">
        {glyph}
      </ui.Icon>
      <ui.Icon label="Add">{glyph}</ui.Icon>
    </>
  ),
  IconButton: (ui) => (
    <>
      <ui.IconButton aria-label="Add module">{glyph}</ui.IconButton>
      <ui.IconButton aria-label="Adding module" loading>
        {glyph}
      </ui.IconButton>
    </>
  ),
  Link: (ui) => (
    <>
      <ui.Link href="#curriculum">View the curriculum</ui.Link>
      <ui.Link href="#report" variant="quiet" external>
        Placement report
      </ui.Link>
    </>
  ),
  Heading: (ui) => (
    <>
      <ui.Heading as="p" size="eyebrow">
        Admissions
      </ui.Heading>
      <ui.Heading as="h3">Where the last cohort went</ui.Heading>
    </>
  ),
  Badge: (ui) => (
    <ui.Badge tone="success" dot>
      Placed
    </ui.Badge>
  ),
  StatusDot: (ui) => <ui.StatusDot tone="danger" pulse />,
  Avatar: (ui) => (
    <ui.Avatar aria-label="Aarav Krishnan — online" ring>
      <ui.AvatarImage src="data:image/png;base64,AA==" /* undecodable on purpose: exercises the fallback with no network request */ alt="" />
      <ui.AvatarFallback>AK</ui.AvatarFallback>
      <ui.AvatarBadge tone="success" />
    </ui.Avatar>
  ),
  AvatarImage: 'Avatar',
  AvatarFallback: 'Avatar',
  AvatarBadge: 'Avatar',
  AvatarGroup: (ui) => (
    <ui.AvatarGroup size="sm" aria-label="Aarav, Priya and 3 more">
      <ui.Avatar>
        <ui.AvatarFallback>AK</ui.AvatarFallback>
      </ui.Avatar>
      <ui.Avatar>
        <ui.AvatarFallback>PV</ui.AvatarFallback>
      </ui.Avatar>
      <ui.AvatarGroupCount>+3</ui.AvatarGroupCount>
    </ui.AvatarGroup>
  ),
  AvatarGroupCount: 'AvatarGroup',
  Divider: (ui) => <ui.Divider>or continue with</ui.Divider>,
  KbdGroup: (ui) => (
    <ui.KbdGroup>
      <ui.KbdMod />
      <ui.Kbd>K</ui.Kbd>
    </ui.KbdGroup>
  ),
  KbdMod: 'KbdGroup',
  CodeBlockGroup: (ui) => (
    <ui.CodeBlockGroup>
      <ui.CodeBlockHeader>
        <span>bfs.py</span>
        <ui.CopyButton value="def bfs(): pass" aria-label="Copy bfs.py to the clipboard" />
      </ui.CodeBlockHeader>
      <ui.CodeBlock>
        <ui.CodeToken kind="keyword">def</ui.CodeToken> bfs(): pass
      </ui.CodeBlock>
    </ui.CodeBlockGroup>
  ),
  CodeBlockHeader: 'CodeBlockGroup',
  CodeBlock: 'CodeBlockGroup',
  CodeToken: 'CodeBlockGroup',
  CopyButton: 'CodeBlockGroup',
};
