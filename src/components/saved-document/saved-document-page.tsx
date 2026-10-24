import type { ComponentPropsWithoutRef } from 'react';
import { SavedDocumentScope } from './saved-document-scope';
import type { SavedDocumentControls } from './use-document-state';

export const SavedDocumentPage = ({
  mode,
  ...props
}: ComponentPropsWithoutRef<'main'> & {
  mode: SavedDocumentControls['mode'];
}) => (
  <SavedDocumentScope value={mode !== 'draft'}>
    <main {...props} data-document-mode={mode} />
  </SavedDocumentScope>
);
