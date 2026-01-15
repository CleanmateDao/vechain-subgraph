import {
  UserRegistered as UserRegisteredEvent,
  EmailVerified as EmailVerifiedEvent,
  UserProfileUpdated as UserProfileUpdatedEvent,
  ReferralCodeSet as ReferralCodeSetEvent,
  UserReferred as UserReferredEvent,
  TeamMemberAdded as TeamMemberAddedEvent,
  TeamMemberRemoved as TeamMemberRemovedEvent,
  TeamMemberPermissionsUpdated as TeamMemberPermissionsUpdatedEvent,
} from "../generated/UserRegistry/UserRegistry";
import {
  User,
  TeamMembership,
  Notification,
  NativePassport,
} from "../generated/schema";
import { Bytes, BigInt } from "@graphprotocol/graph-ts";

export function handleUserRegistered(event: UserRegisteredEvent): void {
  // Load or create User entity
  let user = User.load(event.params.user);
  if (user == null) {
    user = new User(event.params.user);
    user.emailVerified = false;
    user.bonus = BigInt.fromI32(0);
    user.referral = BigInt.fromI32(0);
    user.others = BigInt.fromI32(0);
    user.received = BigInt.fromI32(0);
    user.referralCount = BigInt.fromI32(0);
  }

  user.metadata = event.params.metadata;
  user.email = event.params.email;
  user.registeredAt = event.block.timestamp;
  user.save();

  // Create NativePassport entity for the user
  let passport = NativePassport.load(event.params.user);
  if (passport == null) {
    passport = new NativePassport(event.params.user);
    passport.user = event.params.user;
    passport.status = 0; // NOT_STARTED
    passport.reason = "";
    passport.documentType = 0; // None
    passport.updatedAt = event.block.timestamp;
    passport.blockNumber = event.block.number;
    passport.transactionHash = event.transaction.hash;
    passport.save();

    // Link passport to user
    user.passport = event.params.user;
    user.save();
  }

  // Create notification
  let notification = new Notification(
    event.transaction.hash
      .concatI32(event.logIndex.toI32())
      .concat(Bytes.fromUTF8("user_registered"))
      .toHex()
  );
  notification.user = event.params.user;
  notification.type = "user_registered";
  notification.title = "Welcome to Cleanmate!";
  notification.message = "Your account has been successfully registered.";
  notification.relatedEntity = event.params.user.toHexString();
  notification.relatedEntityType = "user";

  notification.createdAt = event.block.timestamp;
  notification.blockNumber = event.block.number;
  notification.transactionHash = event.transaction.hash;
  notification.save();
}

export function handleEmailVerified(event: EmailVerifiedEvent): void {
  // Load User entity - user must exist (should be created via UserRegistered event)
  let user = User.load(event.params.user);
  if (user == null) {
    // User doesn't exist, skip this event
    return;
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

export function handleUserProfileUpdated(event: UserProfileUpdatedEvent): void {
  // Load User entity - user must exist (should be created via UserRegistered event)
  let user = User.load(event.params.user);
  if (user == null) {
    // User doesn't exist, skip this event
    return;
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
  // Load User entity - user must exist (should be created via UserRegistered event)
  let user = User.load(event.params.user);
  if (user == null) {
    // User doesn't exist, skip this event
    return;
  }

  user.referralCode = event.params.referralCode;
  user.save();
}

export function handleUserReferred(event: UserReferredEvent): void {
  // Load User entity for the referred user - should exist (created via registerWithReferral)
  let user = User.load(event.params.user);
  if (user == null) {
    // User doesn't exist, skip this event
    return;
  }

  user.referrer = event.params.referrer;
  user.save();

  // Increment referral count for the referrer
  let referrer = User.load(event.params.referrer);
  if (referrer != null) {
    referrer.referralCount = referrer.referralCount.plus(BigInt.fromI32(1));
    referrer.save();
  }

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

export function handleTeamMemberAdded(event: TeamMemberAddedEvent): void {
  // Member User must exist (should be created via UserRegistered event)
  let member = User.load(event.params.member);
  if (member == null) {
    // Member doesn't exist, skip this event
    return;
  }

  // Create or update TeamMembership
  let membershipId = event.params.organizer.concat(event.params.member);
  let membership = TeamMembership.load(membershipId.toHex());
  if (membership == null) {
    membership = new TeamMembership(membershipId.toHex());
    membership.organizer = event.params.organizer;
    membership.member = event.params.member;
    membership.memberUser = member.id;
    membership.addedAt = event.block.timestamp;
    membership.lastUpdatedAt = event.block.timestamp;
    membership.deleted = false;
  } else {
    // Ensure User reference is set (for existing memberships)
    membership.memberUser = member.id;
  }

  // If membership was previously deleted, restore it
  if (membership.deleted) {
    membership.deleted = false;
    membership.deletedAt = null;
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
  // Mark TeamMembership as deleted
  let membershipId = event.params.organizer.concat(event.params.member);
  let membership = TeamMembership.load(membershipId.toHex());
  if (membership != null) {
    membership.deleted = true;
    membership.deletedAt = event.block.timestamp;
    membership.save();
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
    // Ensure User reference is set (safety check for existing memberships)
    let member = User.load(event.params.member);
    if (member != null) {
      membership.memberUser = member.id;
    }

    membership.canEditCleanups = event.params.canEditCleanups;
    membership.canManageParticipants = event.params.canManageParticipants;
    membership.canSubmitProof = event.params.canSubmitProof;
    membership.lastUpdatedAt = event.block.timestamp;
    membership.save();
  }
}
