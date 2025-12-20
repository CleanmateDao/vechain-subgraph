import {
  RewardEarned as RewardEarnedEvent,
  RewardsDistributed as RewardsDistributedEvent,
  RewardsClaimed as RewardsClaimedEvent,
  AppIdUpdated as AppIdUpdatedEvent,
  RewardsPoolUpdated as RewardsPoolUpdatedEvent,
} from "../generated/RewardsManager/RewardsManager";
import {
  Transaction,
  User,
  Cleanup,
  CleanupParticipant,
  Notification,
  AppIdUpdated,
  RewardsPoolUpdated,
} from "../generated/schema";
import { Bytes, BigInt } from "@graphprotocol/graph-ts";

export function handleRewardEarned(event: RewardEarnedEvent): void {
  // Create Transaction entity for RECEIVE transaction
  let transactionId = event.transaction.hash
    .concatI32(event.logIndex.toI32())
    .concat(Bytes.fromUTF8("reward_earned"));
  let transaction = new Transaction(transactionId.toHex());
  transaction.user = event.params.participant;
  transaction.cleanupId = event.params.cleanupId.isZero() ? null : event.params.cleanupId;
  transaction.streakSubmissionId = event.params.streakSubmissionId;
  transaction.amount = event.params.amount;
  transaction.transactionType = "RECEIVE";
  transaction.rewardType = event.params.rewardType;
  transaction.timestamp = event.block.timestamp;
  transaction.blockNumber = event.block.number;
  transaction.transactionHash = event.transaction.hash;
  transaction.save();

  // Update User state
  let user = User.load(event.params.participant);
  if (user == null) {
    user = new User(event.params.participant);
    user.metadata = "";
    user.emailVerified = false;
    user.kycStatus = 0;
    user.isOrganizer = false;
    user.registeredAt = event.block.timestamp;
    user.totalRewardsEarned = BigInt.fromI32(0);
    user.totalRewardsClaimed = BigInt.fromI32(0);
    user.pendingRewards = BigInt.fromI32(0);
  }
  // Update total rewards earned and pending rewards
  user.totalRewardsEarned = user.totalRewardsEarned.plus(event.params.amount);
  user.pendingRewards = user.pendingRewards.plus(event.params.amount);
  user.save();

  // Update CleanupParticipant (only if cleanupId is not zero)
  if (!event.params.cleanupId.isZero()) {
    let cleanupId = event.params.cleanupId.toString();
    let participantId = cleanupId + "-" + event.params.participant.toHexString();
    let participant = CleanupParticipant.load(participantId);
    if (participant != null) {
      // Accumulate rewards in case of multiple RewardEarned events for the same participant
      participant.rewardEarned = participant.rewardEarned.plus(
        event.params.amount
      );
      participant.rewardEarnedAt = event.block.timestamp;
      participant.save();
    }
  }

  // Create notification
  let notification = new Notification(
    event.transaction.hash
      .concatI32(event.logIndex.toI32())
      .concat(Bytes.fromUTF8("reward_earned"))
      .toHex()
  );
  notification.user = event.params.participant;
  notification.type = "reward_earned";
  notification.title = "Reward Earned";
  notification.message =
    "You have earned a reward for participating in a cleanup event.";
  notification.relatedEntity = event.params.cleanupId.isZero() ? null : event.params.cleanupId.toString();
  notification.relatedEntityType = "cleanup";
  notification.read = false;
  notification.createdAt = event.block.timestamp;
  notification.blockNumber = event.block.number;
  notification.transactionHash = event.transaction.hash;
  notification.save();
}

export function handleRewardsDistributed(event: RewardsDistributedEvent): void {
  // Update Cleanup state
  let cleanupId = event.params.cleanupId.toString();
  let cleanup = Cleanup.load(cleanupId);
  if (cleanup != null) {
    cleanup.rewardsDistributed = true;
    cleanup.rewardsTotalAmount = event.params.totalAmount;
    cleanup.rewardsParticipantCount = event.params.participantCount;
    cleanup.rewardsDistributedAt = event.block.timestamp;
    cleanup.save();
  }
}

export function handleRewardsClaimed(event: RewardsClaimedEvent): void {
  // Create Transaction entity for CLAIM transaction
  let transactionId = event.transaction.hash
    .concatI32(event.logIndex.toI32())
    .concat(Bytes.fromUTF8("rewards_claimed"));
  let transaction = new Transaction(transactionId.toHex());
  transaction.user = event.params.user;
  transaction.cleanupId = null; // CLAIM transactions don't have a specific cleanup
  transaction.amount = event.params.amount;
  transaction.transactionType = "CLAIM";
  // rewardType is nullable and defaults to null, so we don't need to set it
  transaction.timestamp = event.block.timestamp;
  transaction.blockNumber = event.block.number;
  transaction.transactionHash = event.transaction.hash;
  transaction.save();

  // Update User state
  let user = User.load(event.params.user);
  if (user == null) {
    user = new User(event.params.user);
    user.metadata = "";
    user.emailVerified = false;
    user.kycStatus = 0;
    user.isOrganizer = false;
    user.registeredAt = event.block.timestamp;
    user.totalRewardsEarned = BigInt.fromI32(0);
    user.totalRewardsClaimed = BigInt.fromI32(0);
    user.pendingRewards = BigInt.fromI32(0);
  }
  user.totalRewardsClaimed = user.totalRewardsClaimed.plus(event.params.amount);
  // Calculate pending rewards, ensuring it doesn't go negative
  if (user.pendingRewards >= event.params.amount) {
    user.pendingRewards = user.pendingRewards.minus(event.params.amount);
  } else {
    user.pendingRewards = BigInt.fromI32(0);
  }
  user.save();

  // Create notification
  let notification = new Notification(
    event.transaction.hash
      .concatI32(event.logIndex.toI32())
      .concat(Bytes.fromUTF8("rewards_claimed"))
      .toHex()
  );
  notification.user = event.params.user;
  notification.type = "rewards_claimed";
  notification.title = "Rewards Claimed";
  notification.message = "You have successfully claimed your rewards.";
  notification.relatedEntity = event.params.user.toHexString();
  notification.relatedEntityType = "user";
  notification.read = false;
  notification.createdAt = event.block.timestamp;
  notification.blockNumber = event.block.number;
  notification.transactionHash = event.transaction.hash;
  notification.save();
}

export function handleAppIdUpdated(event: AppIdUpdatedEvent): void {
  let appIdUpdatedId = event.transaction.hash
    .concatI32(event.logIndex.toI32())
    .concat(Bytes.fromUTF8("app_id_updated"));

  let appIdUpdated = new AppIdUpdated(appIdUpdatedId.toHex());
  appIdUpdated.oldAppId = event.params.oldAppId;
  appIdUpdated.newAppId = event.params.newAppId;
  appIdUpdated.blockNumber = event.block.number;
  appIdUpdated.blockTimestamp = event.block.timestamp;
  appIdUpdated.transactionHash = event.transaction.hash;
  appIdUpdated.save();
}

export function handleRewardsPoolUpdated(event: RewardsPoolUpdatedEvent): void {
  let rewardsPoolUpdatedId = event.transaction.hash
    .concatI32(event.logIndex.toI32())
    .concat(Bytes.fromUTF8("rewards_pool_updated"));

  let rewardsPoolUpdated = new RewardsPoolUpdated(rewardsPoolUpdatedId.toHex());
  rewardsPoolUpdated.oldPool = event.params.oldPool;
  rewardsPoolUpdated.newPool = event.params.newPool;
  rewardsPoolUpdated.blockNumber = event.block.number;
  rewardsPoolUpdated.blockTimestamp = event.block.timestamp;
  rewardsPoolUpdated.transactionHash = event.transaction.hash;
  rewardsPoolUpdated.save();
}
