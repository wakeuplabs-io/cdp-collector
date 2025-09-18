import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Address } from "@graphprotocol/graph-ts"
import {
  DonationMade,
  FundsWithdrawn,
  MemberJoined,
  PoolCreated,
  PoolDeactivated
} from "../generated/Distributor/Distributor"

export function createDonationMadeEvent(
  poolId: BigInt,
  donor: Address,
  amount: BigInt
): DonationMade {
  let donationMadeEvent = changetype<DonationMade>(newMockEvent())

  donationMadeEvent.parameters = new Array()

  donationMadeEvent.parameters.push(
    new ethereum.EventParam("poolId", ethereum.Value.fromUnsignedBigInt(poolId))
  )
  donationMadeEvent.parameters.push(
    new ethereum.EventParam("donor", ethereum.Value.fromAddress(donor))
  )
  donationMadeEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return donationMadeEvent
}

export function createFundsWithdrawnEvent(
  member: Address,
  recipient: Address,
  amount: BigInt
): FundsWithdrawn {
  let fundsWithdrawnEvent = changetype<FundsWithdrawn>(newMockEvent())

  fundsWithdrawnEvent.parameters = new Array()

  fundsWithdrawnEvent.parameters.push(
    new ethereum.EventParam("member", ethereum.Value.fromAddress(member))
  )
  fundsWithdrawnEvent.parameters.push(
    new ethereum.EventParam("recipient", ethereum.Value.fromAddress(recipient))
  )
  fundsWithdrawnEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return fundsWithdrawnEvent
}

export function createMemberJoinedEvent(
  poolId: BigInt,
  member: Address,
  percentage: BigInt
): MemberJoined {
  let memberJoinedEvent = changetype<MemberJoined>(newMockEvent())

  memberJoinedEvent.parameters = new Array()

  memberJoinedEvent.parameters.push(
    new ethereum.EventParam("poolId", ethereum.Value.fromUnsignedBigInt(poolId))
  )
  memberJoinedEvent.parameters.push(
    new ethereum.EventParam("member", ethereum.Value.fromAddress(member))
  )
  memberJoinedEvent.parameters.push(
    new ethereum.EventParam(
      "percentage",
      ethereum.Value.fromUnsignedBigInt(percentage)
    )
  )

  return memberJoinedEvent
}

export function createPoolCreatedEvent(
  poolId: BigInt,
  creator: Address,
  title: string,
  description: string,
  imageUri: string
): PoolCreated {
  let poolCreatedEvent = changetype<PoolCreated>(newMockEvent())

  poolCreatedEvent.parameters = new Array()

  poolCreatedEvent.parameters.push(
    new ethereum.EventParam("poolId", ethereum.Value.fromUnsignedBigInt(poolId))
  )
  poolCreatedEvent.parameters.push(
    new ethereum.EventParam("creator", ethereum.Value.fromAddress(creator))
  )
  poolCreatedEvent.parameters.push(
    new ethereum.EventParam("title", ethereum.Value.fromString(title))
  )
  poolCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "description",
      ethereum.Value.fromString(description)
    )
  )
  poolCreatedEvent.parameters.push(
    new ethereum.EventParam("imageUri", ethereum.Value.fromString(imageUri))
  )

  return poolCreatedEvent
}

export function createPoolDeactivatedEvent(
  poolId: BigInt,
  deactivatedBy: Address
): PoolDeactivated {
  let poolDeactivatedEvent = changetype<PoolDeactivated>(newMockEvent())

  poolDeactivatedEvent.parameters = new Array()

  poolDeactivatedEvent.parameters.push(
    new ethereum.EventParam("poolId", ethereum.Value.fromUnsignedBigInt(poolId))
  )
  poolDeactivatedEvent.parameters.push(
    new ethereum.EventParam(
      "deactivatedBy",
      ethereum.Value.fromAddress(deactivatedBy)
    )
  )

  return poolDeactivatedEvent
}
