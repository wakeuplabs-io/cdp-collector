import {
  DonationMade as DonationMadeEvent,
  FundsWithdrawn as FundsWithdrawnEvent,
  MemberJoined as MemberJoinedEvent,
  PoolCreated as PoolCreatedEvent,
  PoolDeactivated as PoolDeactivatedEvent
} from "../generated/Distributor/Distributor"
import {
  DonationMade,
  FundsWithdrawn,
  MemberJoined,
  PoolCreated,
  PoolDeactivated
} from "../generated/schema"

export function handleDonationMade(event: DonationMadeEvent): void {
  let entity = new DonationMade(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.poolId = event.params.poolId
  entity.donor = event.params.donor
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleFundsWithdrawn(event: FundsWithdrawnEvent): void {
  let entity = new FundsWithdrawn(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.member = event.params.member
  entity.recipient = event.params.recipient
  entity.amount = event.params.amount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleMemberJoined(event: MemberJoinedEvent): void {
  let entity = new MemberJoined(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.poolId = event.params.poolId
  entity.member = event.params.member
  entity.percentage = event.params.percentage

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePoolCreated(event: PoolCreatedEvent): void {
  let entity = new PoolCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.poolId = event.params.poolId
  entity.creator = event.params.creator
  entity.title = event.params.title
  entity.description = event.params.description
  entity.imageUri = event.params.imageUri

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlePoolDeactivated(event: PoolDeactivatedEvent): void {
  let entity = new PoolDeactivated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.poolId = event.params.poolId
  entity.deactivatedBy = event.params.deactivatedBy

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
