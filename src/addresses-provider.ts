import { AddressUpdated as AddressUpdatedEvent } from "../generated/AddressesProvider/AddressesProvider";
import { AddressUpdated } from "../generated/schema";

/**
 * Handles AddressUpdated events from AddressesProvider
 * 
 * This handler tracks all address updates including:
 * - USER_REGISTRY
 * - IMPACT
 * - REWARDS_MANAGER
 * - REWARDS_POOL
 * - STREAK
 * - Any custom keys set via setAddress()
 * 
 * To query the current address for a key, filter AddressUpdated entities by key
 * and get the most recent one (highest blockNumber/blockTimestamp).
 */
export function handleAddressUpdated(event: AddressUpdatedEvent): void {
  let entity = new AddressUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32()).toHex()
  );
  entity.key = event.params.key.toString();
  entity.oldAddress = event.params.oldAddress;
  entity.newAddress = event.params.newAddress;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}
