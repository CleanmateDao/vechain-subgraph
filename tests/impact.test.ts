import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import { ImpactCreated } from "../generated/schema"
import { ImpactCreated as ImpactCreatedEvent } from "../generated/Impact/Impact"
import { handleImpactCreated } from "../src/impact"
import { createImpactCreatedEvent } from "./impact-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#tests-structure

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let impactId = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let organizer = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let metadata = "Example string value"
    let date = BigInt.fromI32(234)
    let newImpactCreatedEvent = createImpactCreatedEvent(
      impactId,
      organizer,
      metadata,
      date
    )
    handleImpactCreated(newImpactCreatedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#write-a-unit-test

  test("ImpactCreated created and stored", () => {
    assert.entityCount("ImpactCreated", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "ImpactCreated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "impactId",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "ImpactCreated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "organizer",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "ImpactCreated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "metadata",
      "Example string value"
    )
    assert.fieldEquals(
      "ImpactCreated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "date",
      "234"
    )

    // More assert options:
    // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#asserts
  })
})
