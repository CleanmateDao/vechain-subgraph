import {
  StreakSubmitted as StreakSubmittedEvent,
  StreakApproved as StreakApprovedEvent,
  StreakRejected as StreakRejectedEvent,
} from "../generated/Streak/Streak";
import {
  StreakSubmission,
  StreakSubmissionMedia,
  UserStreakStats,
  User,
  Notification,
} from "../generated/schema";
import { Bytes, BigInt } from "@graphprotocol/graph-ts";

// Helper function to load or create User entity
function loadOrCreateUser(userAddress: Bytes, timestamp: BigInt): User {
  let user = User.load(userAddress);
  if (user == null) {
    user = new User(userAddress);
    user.metadata = "";
    user.emailVerified = false;
    user.kycStatus = 0;
    user.isOrganizer = false;
    user.registeredAt = timestamp;
    user.totalRewardsEarned = BigInt.fromI32(0);
    user.totalRewardsClaimed = BigInt.fromI32(0);
    user.pendingRewards = BigInt.fromI32(0);
    user.save();
  }
  return user;
}

// Helper function to load or create UserStreakStats
function loadOrCreateUserStreakStats(userAddress: Bytes): UserStreakStats {
  let stats = UserStreakStats.load(userAddress);
  if (stats == null) {
    stats = new UserStreakStats(userAddress);
    stats.user = userAddress;
    stats.totalSubmissions = BigInt.fromI32(0);
    stats.approvedSubmissions = BigInt.fromI32(0);
    stats.rejectedSubmissions = BigInt.fromI32(0);
    stats.pendingSubmissions = BigInt.fromI32(0);
    stats.totalAmount = BigInt.fromI32(0);
    stats.save();
  }
  return stats;
}

export function handleStreakSubmitted(event: StreakSubmittedEvent): void {
  // Ensure user exists
  loadOrCreateUser(event.params.user, event.block.timestamp);

  // Create StreakSubmission entity
  let submissionId = event.params.submissionId.toString();
  let submission = new StreakSubmission(submissionId);
  submission.user = event.params.user;
  submission.submissionId = event.params.submissionId;
  submission.metadata = event.params.metadata;
  submission.status = 0; // PENDING
  submission.submittedAt = event.block.timestamp;
  submission.reviewedAt = null;
  submission.amount = null;
  submission.rejectionReason = null;
  submission.ipfsHashes = [];
  submission.mimetypes = [];
  submission.blockNumber = event.block.number;
  submission.transactionHash = event.transaction.hash;
  submission.save();

  // Update UserStreakStats
  let stats = loadOrCreateUserStreakStats(event.params.user);
  stats.totalSubmissions = stats.totalSubmissions.plus(BigInt.fromI32(1));
  stats.pendingSubmissions = stats.pendingSubmissions.plus(BigInt.fromI32(1));
  stats.lastSubmissionAt = event.block.timestamp;
  stats.save();

  // Create notification
  let notification = new Notification(
    event.transaction.hash
      .concatI32(event.logIndex.toI32())
      .concat(Bytes.fromUTF8("streak_submitted"))
      .toHex()
  );
  notification.user = event.params.user;
  notification.type = "streak_submitted";
  notification.title = "Streak Submitted";
  notification.message =
    "Your sustainable action submission has been received and is pending review.";
  // Convert BigInt submissionId to Bytes (pad to 32 bytes)
  let submissionIdBytes = Bytes.fromHexString(
    "0x" + event.params.submissionId.toHex().slice(2).padStart(64, "0")
  );
  notification.relatedEntity = submissionIdBytes;
  notification.relatedEntityType = "streak_submission";
  notification.read = false;
  notification.createdAt = event.block.timestamp;
  notification.blockNumber = event.block.number;
  notification.transactionHash = event.transaction.hash;
  notification.save();
}

export function handleStreakApproved(event: StreakApprovedEvent): void {
  // Load submission
  let submissionId = event.params.submissionId.toString();
  let submission = StreakSubmission.load(submissionId);
  if (submission == null) {
    // If submission doesn't exist, create it (shouldn't happen, but handle gracefully)
    submission = new StreakSubmission(submissionId);
    submission.user = event.params.user;
    submission.submissionId = event.params.submissionId;
    submission.metadata = "";
    submission.ipfsHashes = [];
    submission.mimetypes = [];
    submission.submittedAt = event.block.timestamp;
    submission.blockNumber = event.block.number;
    submission.transactionHash = event.transaction.hash;
  }

  // Update submission
  submission.status = 1; // APPROVED
  submission.reviewedAt = event.block.timestamp;
  submission.amount = event.params.amount;
  submission.rejectionReason = null;
  submission.save();

  // Update UserStreakStats
  let stats = loadOrCreateUserStreakStats(event.params.user);
  stats.approvedSubmissions = stats.approvedSubmissions.plus(BigInt.fromI32(1));
  stats.pendingSubmissions = stats.pendingSubmissions.minus(BigInt.fromI32(1));
  stats.totalAmount = stats.totalAmount.plus(event.params.amount);
  stats.save();

  // Create notification
  let notification = new Notification(
    event.transaction.hash
      .concatI32(event.logIndex.toI32())
      .concat(Bytes.fromUTF8("streak_approved"))
      .toHex()
  );
  notification.user = event.params.user;
  notification.type = "streak_approved";
  notification.title = "Streak Approved";
  notification.message =
    "Your sustainable action submission has been approved!";
  // Convert BigInt submissionId to Bytes (pad to 32 bytes)
  let submissionIdBytes = Bytes.fromHexString(
    "0x" + event.params.submissionId.toHex().slice(2).padStart(64, "0")
  );
  notification.relatedEntity = submissionIdBytes;
  notification.relatedEntityType = "streak_submission";
  notification.read = false;
  notification.createdAt = event.block.timestamp;
  notification.blockNumber = event.block.number;
  notification.transactionHash = event.transaction.hash;
  notification.save();
}

export function handleStreakRejected(event: StreakRejectedEvent): void {
  // Load submission
  let submissionId = event.params.submissionId.toString();
  let submission = StreakSubmission.load(submissionId);
  if (submission == null) {
    // If submission doesn't exist, create it (shouldn't happen, but handle gracefully)
    submission = new StreakSubmission(submissionId);
    submission.user = event.params.user;
    submission.submissionId = event.params.submissionId;
    submission.metadata = "";
    submission.ipfsHashes = [];
    submission.mimetypes = [];
    submission.submittedAt = event.block.timestamp;
    submission.blockNumber = event.block.number;
    submission.transactionHash = event.transaction.hash;
  }

  // Update submission
  submission.status = 2; // REJECTED
  submission.reviewedAt = event.block.timestamp;
  submission.amount = null;
  submission.rejectionReason = event.params.reason;
  submission.save();

  // Update UserStreakStats
  let stats = loadOrCreateUserStreakStats(event.params.user);
  stats.rejectedSubmissions = stats.rejectedSubmissions.plus(BigInt.fromI32(1));
  stats.pendingSubmissions = stats.pendingSubmissions.minus(BigInt.fromI32(1));
  stats.save();

  // Create notification
  let notification = new Notification(
    event.transaction.hash
      .concatI32(event.logIndex.toI32())
      .concat(Bytes.fromUTF8("streak_rejected"))
      .toHex()
  );
  notification.user = event.params.user;
  notification.type = "streak_rejected";
  notification.title = "Streak Rejected";
  notification.message =
    "Your sustainable action submission has been rejected. Reason: " +
    event.params.reason;
  // Convert BigInt submissionId to Bytes (pad to 32 bytes)
  let submissionIdBytes = Bytes.fromHexString(
    "0x" + event.params.submissionId.toHex().slice(2).padStart(64, "0")
  );
  notification.relatedEntity = submissionIdBytes;
  notification.relatedEntityType = "streak_submission";
  notification.read = false;
  notification.createdAt = event.block.timestamp;
  notification.blockNumber = event.block.number;
  notification.transactionHash = event.transaction.hash;
  notification.save();
}
