import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum ThirdPartyType {
  CLIENT = 'client',
  SUPPLIER = 'supplier',
}

export enum DocumentType {
  CC = 'CC',
  NIT = 'NIT',
  CE = 'CE',
  PASSPORT = 'PASSPORT',
}

/** Tercero: cliente o proveedor. */
@Entity('third_parties')
export class ThirdParty extends BaseEntity {
  @Column({ type: 'enum', enum: ThirdPartyType, default: ThirdPartyType.CLIENT })
  type: ThirdPartyType;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: DocumentType, default: DocumentType.CC })
  docType: DocumentType;

  @Index()
  @Column({ nullable: true })
  docNumber: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  balance: string;

  @Column({ default: true })
  active: boolean;
}
