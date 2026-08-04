export class DriveSyncNotConnectedError extends Error {
  constructor(message = "Google Drive is not connected") {
    super(message);
    this.name = "DriveSyncNotConnectedError";
  }
}
