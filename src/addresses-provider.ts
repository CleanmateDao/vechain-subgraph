import { AddressUpdated as AddressUpdatedEvent } from "../generated/AddressesProvider/AddressesProvider";
import { AddressUpdated } from "../generated/schema";

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
