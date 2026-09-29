import type { RecipientRecord } from '../../storage/repositories/recipients';
import { RecipientDeleteModal } from './recipient-delete-modal';
import { RecipientEditModal } from './recipient-edit-modal';
import { RecipientNewModal } from './recipient-new-modal';
import type { ProtocolValues } from './protocol-types';

type Props = {
  creating: boolean;
  editing: RecipientRecord | null;
  deleting: RecipientRecord | null;
  onCloseCreate: () => void;
  onCloseEdit: () => void;
  onCloseDelete: () => void;
  onCreate: (fullName: string) => Promise<void>;
  onExisting: (recipient: RecipientRecord) => void;
  onSave: (recipient: RecipientRecord, values: ProtocolValues) => Promise<void>;
  onDelete: (recipient: RecipientRecord) => Promise<void>;
};

export const RecipientDatabaseDialogs = ({
  creating,
  editing,
  deleting,
  onCloseCreate,
  onCloseEdit,
  onCloseDelete,
  onCreate,
  onExisting,
  onSave,
  onDelete,
}: Props) => (
  <>
    {creating && (
      <RecipientNewModal
        onClose={onCloseCreate}
        onCreate={onCreate}
        onExisting={onExisting}
        existingActionLabel="Открыть реципиента"
        hint="Реципиент будет сразу добавлен в базу без создания бланка."
      />
    )}
    {editing && (
      <RecipientEditModal
        recipient={editing}
        onClose={onCloseEdit}
        onSave={(values) => onSave(editing, values)}
      />
    )}
    {deleting && (
      <RecipientDeleteModal
        recipient={deleting}
        onClose={onCloseDelete}
        onDelete={() => onDelete(deleting)}
      />
    )}
  </>
);
