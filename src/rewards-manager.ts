import {
  RewardEarned as RewardEarnedEvent,
  RewardsDistributed as RewardsDistributedEvent,
  AppIdUpdated as AppIdUpdatedEvent,
  RewardsPoolUpdated as RewardsPoolUpdatedEvent,
  TokenTransferred as TokenTransferredEvent,
} from "../generated/RewardsManager/RewardsManager";
import {
  Transaction,
  User,
  Impact,
  ImpactParticipant,
  Notification,
  AppIdUpdated,
  RewardsPoolUpdated,
  StreakSubmission,
} from "../generated/schema";
import { Bytes, BigInt } from "@graphprotocol/graph-ts";

export function handleRewardEarned(event: RewardEarnedEvent): void {
  // Create Transaction entity for RECEIVE transaction
  let transactionId = event.transaction.hash
    .concatI32(event.logIndex.toI32())
    .concat(Bytes.fromUTF8("reward_earned"));
  let transaction = new Transaction(transactionId.toHex());
  transaction.user = event.params.participant;
  transaction.impactId = event.params.impactId.isZero()
    ? null
    : event.params.impactId;
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
    user.registeredAt = event.block.timestamp;
    user.bonus = BigInt.fromI32(0);
    user.referral = BigInt.fromI32(0);
    user.others = BigInt.fromI32(0);
    user.received = BigInt.fromI32(0);
    user.referralCount = BigInt.fromI32(0);
  }
  // Update rewards based on rewardType (0=REFERRAL, 1=BONUS, 4=OTHERS)
  // Always increment received (total)
  user.received = user.received.plus(event.params.amount);
  if (event.params.rewardType == 0) {
    // REFERRAL
    user.referral = user.referral.plus(event.params.amount);
  } else if (event.params.rewardType == 1) {
    // BONUS
    user.bonus = user.bonus.plus(event.params.amount);
  } else if (event.params.rewardType == 4) {
    // OTHERS
    user.others = user.others.plus(event.params.amount);
  }
  user.save();

  // Update ImpactParticipant (only if impactId is not zero)
  if (!event.params.impactId.isZero()) {
    let impactId = event.params.impactId.toString();
    let participantId =
      impactId + "-" + event.params.participant.toHexString();
    let participant = ImpactParticipant.load(participantId);
    if (participant != null) {
      // Ensure user field is set (for backward compatibility with existing data)
      participant.user = event.params.participant;
      // Accumulate rewards in case of multiple RewardEarned events for the same participant
      participant.rewardEarned = participant.rewardEarned.plus(
        event.params.amount
      );
      participant.rewardEarnedAt = event.block.timestamp;
      participant.save();
    }
  }

  // Update StreakSubmission status to REWARDED (3) if streakSubmissionId is not zero
  if (!event.params.streakSubmissionId.isZero()) {
    let submissionId = event.params.streakSubmissionId.toString();
    let submission = StreakSubmission.load(submissionId);
    if (submission != null) {
      submission.status = 3; // REWARDED
      submission.save();
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
    "You have earned a reward for participating in a impact event.";
  notification.relatedEntity = event.params.impactId.isZero()
    ? null
    : event.params.impactId.toString();
  notification.relatedEntityType = "impact";

  notification.createdAt = event.block.timestamp;
  notification.blockNumber = event.block.number;
  notification.transactionHash = event.transaction.hash;
  notification.save();
}

export function handleRewardsDistributed(event: RewardsDistributedEvent): void {
  // Update Impact state
  let impactId = event.params.impactId.toString();
  let impact = Impact.load(impactId);
  if (impact != null) {
    impact.rewardsDistributed = true;
    impact.rewardsTotalAmount = event.params.totalAmount;
    impact.rewardsParticipantCount = event.params.participantCount;
    impact.rewardsDistributedAt = event.block.timestamp;
    impact.status = 4; // REWARDED
    impact.updatedAt = event.block.timestamp;
    impact.save();
  }
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

export function handleTokenTransferred(event: TokenTransferredEvent): void {
  // Create Transaction entity for CLAIM transaction
  let transactionId = event.transaction.hash
    .concatI32(event.logIndex.toI32())
    .concat(Bytes.fromUTF8("token_transferred"));
  let transaction = new Transaction(transactionId.toHex());
  transaction.user = event.params.user;
  transaction.impactId = null;
  transaction.streakSubmissionId = null;
  transaction.amount = event.params.amount;
  transaction.transactionType = "CLAIM";
  // rewardType is not set for CLAIM transactions (will be null in GraphQL)
  transaction.timestamp = event.block.timestamp;
  transaction.blockNumber = event.block.number;
  transaction.transactionHash = event.transaction.hash;
  transaction.save();
}
