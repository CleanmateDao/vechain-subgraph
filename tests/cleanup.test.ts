import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import { CleanupCreated } from "../generated/schema"
import { CleanupCreated as CleanupCreatedEvent } from "../generated/Cleanup/Cleanup"
import { handleCleanupCreated } from "../src/cleanup"
import { createCleanupCreatedEvent } from "./cleanup-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#tests-structure

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let cleanupAddress = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let organizer = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let metadata = "Example string value"
    let date = BigInt.fromI32(234)
    let newCleanupCreatedEvent = createCleanupCreatedEvent(
      cleanupAddress,
      organizer,
      metadata,
      date
    )
    handleCleanupCreated(newCleanupCreatedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#write-a-unit-test

  test("CleanupCreated created and stored", () => {
    assert.entityCount("CleanupCreated", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "CleanupCreated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "cleanupAddress",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "CleanupCreated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "organizer",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "CleanupCreated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "metadata",
      "Example string value"
    )
    assert.fieldEquals(
      "CleanupCreated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "date",
      "234"
    )

    // More assert options:
    // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#asserts
  })
})
