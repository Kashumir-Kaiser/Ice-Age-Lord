import type { ApiErrorCode, ApiErrorEnvelope } from '../../contracts/src/api.ts';
import { RepositoryError } from '../../storage/src/repository.ts';

export class ApiProblem extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly displayText: string;
  readonly currentRevision?: number;
  readonly retryable?: boolean;

  constructor(
    status: number,
    code: ApiErrorCode,
    message: string,
    displayText: string,
    currentRevision?: number,
    retryable?: boolean,
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.displayText = displayText;
    this.currentRevision = currentRevision;
    this.retryable = retryable;
    this.name = 'ApiProblem';
  }

  toEnvelope(): ApiErrorEnvelope {
    return {
      error: {
        code: this.code,
        message: this.message,
        displayText: this.displayText,
        ...(this.currentRevision === undefined ? {} : { currentRevision: this.currentRevision }),
        ...(this.retryable === undefined ? {} : { retryable: this.retryable }),
      },
    };
  }
}

export function fromRepositoryError(error: unknown): ApiProblem {
  if (!(error instanceof RepositoryError)) return new ApiProblem(500, 'INTERNAL_ERROR', 'An internal service error occurred.', 'Đã xảy ra lỗi máy chủ.');
  switch (error.code) {
    case 'SAVE_NOT_FOUND':
    case 'RECEIPT_NOT_FOUND':
    case 'CHECKPOINT_NOT_FOUND':
      return new ApiProblem(404, 'NOT_FOUND', 'The requested record was not found.', 'Không tìm thấy dữ liệu yêu cầu.');
    case 'SLOT_CONFLICT':
      return new ApiProblem(409, 'SLOT_CONFLICT', error.message, 'Tên ô lưu này đã được dùng.');
    case 'CREATION_KEY_REUSED':
      return new ApiProblem(409, 'IDEMPOTENCY_KEY_REUSED', error.message, 'Mã tạo lượt lưu đã được dùng với nội dung khác.');
    case 'SAVE_ID_EXISTS':
      return new ApiProblem(409, 'BACKUP_INVALID', error.message, 'Bản sao lưu trùng với lượt lưu hiện có.');
    case 'STALE_REVISION':
      return new ApiProblem(409, 'STALE_REVISION', error.message, 'Dữ liệu đã thay đổi. Hãy tải lại trước khi thử lại.', undefined, true);
    case 'BACKUP_INVALID':
      return new ApiProblem(400, 'BACKUP_INVALID', error.message, 'Bản sao lưu không hợp lệ.');
    case 'CHECKPOINT_LIMIT_REACHED':
      return new ApiProblem(409, 'RULE_NOT_READY', error.message, 'Đã đạt giới hạn bản chụp cho lượt lưu này.');
    default:
      return new ApiProblem(error.status >= 500 ? 500 : 409, error.status >= 500 ? 'INTERNAL_ERROR' : 'RULE_NOT_READY', error.message, error.status >= 500 ? 'Đã xảy ra lỗi máy chủ.' : 'Yêu cầu chưa được hỗ trợ.');
  }
}
