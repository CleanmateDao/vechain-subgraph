import {
  UserRegistered as UserRegisteredEvent,
  EmailVerified as EmailVerifiedEvent,
  KYCStatusUpdated as KYCStatusUpdatedEvent,
  UserProfileUpdated as UserProfileUpdatedEvent,
  ReferralCodeSet as ReferralCodeSetEvent,
  UserReferred as UserReferredEvent,
  OrganizerStatusUpdated as OrganizerStatusUpdatedEvent,
  TeamMemberAdded as TeamMemberAddedEvent,
  TeamMemberRemoved as TeamMemberRemovedEvent,
  TeamMemberPermissionsUpdated as TeamMemberPermissionsUpdatedEvent,
} from "../generated/UserRegistry/UserRegistry";
import { User, TeamMembership, Notification } from "../generated/schema";
import { Bytes, BigInt, store } from "@graphprotocol/graph-ts";

export function handleUserRegistered(event: UserRegisteredEvent): void {
  // Load or create User entity
  let user = User.load(event.params.user);
  if (user == null) {
    user = new User(event.params.user);
    user.emailVerified = false;
    user.kycStatus = 0; // NOT_STARTED
    user.isOrganizer = false;
    user.totalRewardsEarned = BigInt.fromI32(0);
    user.totalRewardsClaimed = BigInt.fromI32(0);
    user.pendingRewards = BigInt.fromI32(0);
  }

  user.metadata = event.params.metadata;
  user.email = event.params.email;
  user.registeredAt = event.block.timestamp;
  user.save();

  // Create notification
  let notification = new Notification(
    event.transaction.hash
      .concatI32(event.logIndex.toI32())
      .concat(Bytes.fromUTF8("user_registered"))
      .toHex()
  );
  notification.user = event.params.user;
  notification.type = "user_registered";
  notification.title = "Welcome to CleanMate!";
  notification.message = "Your account has been successfully registered.";
  notification.relatedEntity = event.params.user.toHexString();
  notification.relatedEntityType = "user";

  notification.createdAt = event.block.timestamp;
  notification.blockNumber = event.block.number;
  notification.transactionHash = event.transaction.hash;
  notification.save();
}

export function handleEmailVerified(event: EmailVerifiedEvent): void {
  // Load or create User entity
  let user = User.load(event.params.user);
  if (user == null) {
    user = new User(event.params.user);
    user.metadata = "";
    user.kycStatus = 0;
    user.isOrganizer = false;
    user.registeredAt = event.block.timestamp;
    user.totalRewardsClaimed = BigInt.fromI32(0);
    user.pendingRewards = BigInt.fromI32(0);
  }

  user.emailVerified = true;
  user.emailVerifiedAt = event.block.timestamp;
  user.save();

  // Create notification
  let notification = new Notification(
    event.transaction.hash
      .concatI32(event.logIndex.toI32())
      .concat(Bytes.fromUTF8("email_verified"))
      .toHex()
  );
  notification.user = event.params.user;
  notification.type = "email_verified";
  notification.title = "Email Verified";
  notification.message = "Your email has been successfully verified.";
  notification.relatedEntity = event.params.user.toHexString();
  notification.relatedEntityType = "user";

  notification.createdAt = event.block.timestamp;
  notification.blockNumber = event.block.number;
  notification.transactionHash = event.transaction.hash;
  notification.save();
}

export function handleKYCStatusUpdated(event: KYCStatusUpdatedEvent): void {
  // Load or create User entity
  let user = User.load(event.params.user);
  if (user == null) {
    user = new User(event.params.user);
    user.metadata = "";
    user.emailVerified = false;
    user.isOrganizer = false;
    user.registeredAt = event.block.timestamp;
    user.totalRewardsClaimed = BigInt.fromI32(0);
    user.pendingRewards = BigInt.fromI32(0);
  }

  user.kycStatus = event.params.newStatus;
  user.save();

  // Create notification
  let statusNames = ["NOT_STARTED", "PENDING", "VERIFIED", "REJECTED"];
  let statusIndex = event.params.newStatus;
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

export function handleUserProfileUpdated(event: UserProfileUpdatedEvent): void {
  // Load or create User entity
  let user = User.load(event.params.user);
  if (user == null) {
    user = new User(event.params.user);
    user.emailVerified = false;
    user.kycStatus = 0;
    user.isOrganizer = false;
    user.registeredAt = event.block.timestamp;
    user.totalRewardsClaimed = BigInt.fromI32(0);
    user.pendingRewards = BigInt.fromI32(0);
  }

  user.metadata = event.params.metadata;
  user.lastProfileUpdateAt = event.block.timestamp;
  user.save();

  // Create notification
  let notification = new Notification(
    event.transaction.hash
      .concatI32(event.logIndex.toI32())
      .concat(Bytes.fromUTF8("user_profile_updated"))
      .toHex()
  );
  notification.user = event.params.user;
  notification.type = "user_profile_updated";
  notification.title = "Profile Updated";
  notification.message = "Your profile has been successfully updated.";
  notification.relatedEntity = event.params.user.toHexString();
  notification.relatedEntityType = "user";

  notification.createdAt = event.block.timestamp;
  notification.blockNumber = event.block.number;
  notification.transactionHash = event.transaction.hash;
  notification.save();
}

export function handleReferralCodeSet(event: ReferralCodeSetEvent): void {
  // Load or create User entity
  let user = User.load(event.params.user);
  if (user == null) {
    user = new User(event.params.user);
    user.metadata = "";
    user.emailVerified = false;
    user.kycStatus = 0;
    user.isOrganizer = false;
    user.registeredAt = event.block.timestamp;
    user.totalRewardsClaimed = BigInt.fromI32(0);
    user.pendingRewards = BigInt.fromI32(0);
  }

  user.referralCode = event.params.referralCode;
  user.save();
}

export function handleUserReferred(event: UserReferredEvent): void {
  // Load or create User entity for the referred user
  let user = User.load(event.params.user);
  if (user == null) {
    user = new User(event.params.user);
    user.metadata = "";
    user.emailVerified = false;
    user.kycStatus = 0;
    user.isOrganizer = false;
    user.registeredAt = event.block.timestamp;
    user.totalRewardsClaimed = BigInt.fromI32(0);
    user.pendingRewards = BigInt.fromI32(0);
  }

  user.referrer = event.params.referrer;
  user.save();

  // Create notification for referrer
  let notification = new Notification(
    event.transaction.hash
      .concatI32(event.logIndex.toI32())
      .concat(Bytes.fromUTF8("user_referred"))
      .toHex()
  );
  notification.user = event.params.referrer;
  notification.type = "user_referred";
  notification.title = "New Referral";
  notification.message =
    "A new user has been referred using your referral code.";
  notification.relatedEntity = event.params.user.toHexString();
  notification.relatedEntityType = "user";

  notification.createdAt = event.block.timestamp;
  notification.blockNumber = event.block.number;
  notification.transactionHash = event.transaction.hash;
  notification.save();
}

export function handleOrganizerStatusUpdated(
  event: OrganizerStatusUpdatedEvent
): void {
  // Load or create User entity
  let user = User.load(event.params.user);
  if (user == null) {
    user = new User(event.params.user);
    user.metadata = "";
    user.emailVerified = false;
    user.kycStatus = 0;
    user.registeredAt = event.block.timestamp;
    user.totalRewardsClaimed = BigInt.fromI32(0);
    user.pendingRewards = BigInt.fromI32(0);
  }

  user.isOrganizer = event.params.isOrganizer;
  user.save();

  // Create notification
  let notification = new Notification(
    event.transaction.hash
      .concatI32(event.logIndex.toI32())
      .concat(Bytes.fromUTF8("organizer_status_updated"))
      .toHex()
  );
  notification.user = event.params.user;
  notification.type = "organizer_status_updated";
  notification.title = "Organizer Status Updated";
  notification.message = event.params.isOrganizer
    ? "You have been granted organizer status."
    : "Your organizer status has been revoked.";
  notification.relatedEntity = event.params.user.toHexString();
  notification.relatedEntityType = "user";

  notification.createdAt = event.block.timestamp;
  notification.blockNumber = event.block.number;
  notification.transactionHash = event.transaction.hash;
  notification.save();
}

export function handleTeamMemberAdded(event: TeamMemberAddedEvent): void {
  // Ensure member User exists
  let member = User.load(event.params.member);
  if (member == null) {
    member = new User(event.params.member);
    member.metadata = "";
    member.emailVerified = false;
    member.kycStatus = 0;
    member.isOrganizer = false;
    member.registeredAt = event.block.timestamp;
    member.totalRewardsClaimed = BigInt.fromI32(0);
    member.pendingRewards = BigInt.fromI32(0);
    member.save();
  }

  // Create or update TeamMembership
  let membershipId = event.params.organizer.concat(event.params.member);
  let membership = TeamMembership.load(membershipId.toHex());
  if (membership == null) {
    membership = new TeamMembership(membershipId.toHex());
    membership.organizer = event.params.organizer;
    membership.member = event.params.member;
    membership.addedAt = event.block.timestamp;
    membership.lastUpdatedAt = event.block.timestamp;
  }

  membership.canEditCleanups = event.params.canEditCleanups;
  membership.canManageParticipants = event.params.canManageParticipants;
  membership.canSubmitProof = event.params.canSubmitProof;
  membership.lastUpdatedAt = event.block.timestamp;
  membership.save();

  // Create notification for team member
  let notification = new Notification(
    event.transaction.hash
      .concatI32(event.logIndex.toI32())
      .concat(Bytes.fromUTF8("team_member_added"))
      .toHex()
  );
  notification.user = event.params.member;
  notification.type = "team_member_added";
  notification.title = "Added to Team";
  notification.message = "You have been added as a team member.";
  notification.relatedEntity = event.params.organizer.toHexString();
  notification.relatedEntityType = "user";

  notification.createdAt = event.block.timestamp;
  notification.blockNumber = event.block.number;
  notification.transactionHash = event.transaction.hash;
  notification.save();
}

export function handleTeamMemberRemoved(event: TeamMemberRemovedEvent): void {
  // Remove TeamMembership
  let membershipId = event.params.organizer.concat(event.params.member);
  let membership = TeamMembership.load(membershipId.toHex());
  if (membership != null) {
    // In The Graph, we can't actually delete entities, but we can mark them as removed
    // For now, we'll just remove the entity from the store
    store.remove("TeamMembership", membershipId.toHex());
  }

  // Create notification for team member
  let notification = new Notification(
    event.transaction.hash
      .concatI32(event.logIndex.toI32())
      .concat(Bytes.fromUTF8("team_member_removed"))
      .toHex()
  );
  notification.user = event.params.member;
  notification.type = "team_member_removed";
  notification.title = "Removed from Team";
  notification.message = "You have been removed from the team.";
  notification.relatedEntity = event.params.organizer.toHexString();
  notification.relatedEntityType = "user";

  notification.createdAt = event.block.timestamp;
  notification.blockNumber = event.block.number;
  notification.transactionHash = event.transaction.hash;
  notification.save();
}

export function handleTeamMemberPermissionsUpdated(
  event: TeamMemberPermissionsUpdatedEvent
): void {
  // Update TeamMembership
  let membershipId = event.params.organizer.concat(event.params.member);
  let membership = TeamMembership.load(membershipId.toHex());
  if (membership != null) {
    membership.canEditCleanups = event.params.canEditCleanups;
    membership.canManageParticipants = event.params.canManageParticipants;
    membership.canSubmitProof = event.params.canSubmitProof;
    membership.lastUpdatedAt = event.block.timestamp;
    membership.save();
  }
}
