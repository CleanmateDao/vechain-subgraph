import { KYCStatusUpdated as KYCStatusUpdatedEvent } from "../generated/NativePassport/NativePassport";
import { User, Notification, NativePassport } from "../generated/schema";
import { Bytes, BigInt } from "@graphprotocol/graph-ts";

export function handleKYCStatusUpdated(event: KYCStatusUpdatedEvent): void {
  // Load or create User entity - user should exist (created via UserRegistered event from UserRegistry)
  let user = User.load(event.params.user);
  if (user == null) {
    return;
  }

  // Load or create NativePassport entity
  let passport = NativePassport.load(event.params.user);
  if (passport == null) {
    // Create NativePassport if it doesn't exist (should have been created on registration, but handle edge cases)
    passport = new NativePassport(event.params.user);
    passport.user = event.params.user;
    passport.documentType = 0; // None (default, will be updated if available)
  }

  // Update NativePassport entity
  passport.status = event.params.status;
  passport.reason = event.params.reason;
  passport.updatedAt = event.block.timestamp;
  passport.blockNumber = event.block.number;
  passport.transactionHash = event.transaction.hash;
  passport.save();

  // Link passport to user
  user.passport = event.params.user;
  user.save();

  // Create notification
  let statusNames = ["NOT_STARTED", "PENDING", "VERIFIED", "REJECTED"];
  let statusIndex = event.params.status;
  // Bounds check to prevent array out-of-bounds access
  if (statusIndex < 0) {
    statusIndex = 0;
  } else if (statusIndex >= statusNames.length) {
    statusIndex = statusNames.length - 1;
  }

  let notification = new Notification(
    event.transaction.hash
      .concatI32(event.logIndex.toI32())
      .concat(Bytes.fromUTF8("kyc_status_updated"))
      .toHex()
  );
  notification.user = event.params.user;
  notification.type = "kyc_status_updated";
  notification.title = "KYC Status Updated";
  notification.message =
    "Your KYC status has been updated to " + statusNames[statusIndex] + ".";
  notification.relatedEntity = event.params.user.toHexString();
  notification.relatedEntityType = "user";

  notification.createdAt = event.block.timestamp;
  notification.blockNumber = event.block.number;
  notification.transactionHash = event.transaction.hash;
  notification.save();
}
