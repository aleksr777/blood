import type {
  BloodRequestRecord,
  ProtocolRecord,
  RecipientRecord,
  RegistrationRecord,
} from '../../storage/repositories/recipients';
import { RecipientDeleteModal } from './recipient-delete-modal';
import { RecipientEditModal } from './recipient-edit-modal';
import { RecipientNewModal } from './recipient-new-modal';
import { ProtocolRecordDeleteModal } from './protocol-record-delete-modal';
import { RegistrationRecordDeleteModal } from './registration-record-delete-modal';
import { BloodRequestRecordDeleteModal } from './blood-request-record-delete-modal';
import type { ProtocolValues } from './protocol-types';

type Props = {
  creating: boolean;
  editing: RecipientRecord | null;
  deleting: RecipientRecord | null;
  deletingRecord: ProtocolRecord | null;
  deletingRegistrationRecord: RegistrationRecord | null;
  deletingBloodRequestRecord: BloodRequestRecord | null;
  selectedRecipient: RecipientRecord | null;
  onCloseCreate: () => void;
  onCloseEdit: () => void;
  onCloseDelete: () => void;
  onCloseRecordDelete: () => void;
  onCloseRegistrationRecordDelete: () => void;
  onCloseBloodRequestRecordDelete: () => void;
  onCreate: (fullName: string) => Promise<void>;
  onExisting: (recipient: RecipientRecord) => void;
  onSave: (recipient: RecipientRecord, values: ProtocolValues) => Promise<void>;
  onDelete: (recipient: RecipientRecord) => Promise<void>;
  onDeleteRecord: (record: ProtocolRecord) => Promise<void>;
  onDeleteRegistrationRecord: (record: RegistrationRecord) => Promise<void>;
  onDeleteBloodRequestRecord: (record: BloodRequestRecord) => Promise<void>;
};

export const RecipientDatabaseDialogs = ({
  creating,
  editing,
  deleting,
  deletingRecord,
  deletingRegistrationRecord,
  deletingBloodRequestRecord,
  selectedRecipient,
  onCloseCreate,
  onCloseEdit,
  onCloseDelete,
  onCloseRecordDelete,
  onCloseRegistrationRecordDelete,
  onCloseBloodRequestRecordDelete,
  onCreate,
  onExisting,
  onSave,
  onDelete,
  onDeleteRecord,
  onDeleteRegistrationRecord,
  onDeleteBloodRequestRecord,
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
    {deletingRecord && selectedRecipient && (
      <ProtocolRecordDeleteModal
        record={deletingRecord}
        recipientName={selectedRecipient.fullName}
        onClose={onCloseRecordDelete}
        onDelete={() => onDeleteRecord(deletingRecord)}
      />
    )}
    {deletingRegistrationRecord && selectedRecipient && (
      <RegistrationRecordDeleteModal
        record={deletingRegistrationRecord}
        recipientName={selectedRecipient.fullName}
        onClose={onCloseRegistrationRecordDelete}
        onDelete={() => onDeleteRegistrationRecord(deletingRegistrationRecord)}
      />
    )}
    {deletingBloodRequestRecord && selectedRecipient && (
      <BloodRequestRecordDeleteModal
        record={deletingBloodRequestRecord}
        recipientName={selectedRecipient.fullName}
        onClose={onCloseBloodRequestRecordDelete}
        onDelete={() => onDeleteBloodRequestRecord(deletingBloodRequestRecord)}
      />
    )}
  </>
);
