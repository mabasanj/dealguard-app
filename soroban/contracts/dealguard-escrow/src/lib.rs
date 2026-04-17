#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error, Address, Env, String,
};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum EscrowStatus {
    Pending,
    Funded,
    Released,
    Refunded,
    Disputed,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Terms,
}

#[contracttype]
#[derive(Clone)]
pub struct EscrowTerms {
    pub buyer: Address,
    pub seller: Address,
    pub moderator: Address,
    pub fiat_amount_cents: i128,
    pub asset_code: String,
    pub anchor: String,
    pub external_reference: String,
    pub status: EscrowStatus,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ContractError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    InvalidAmount = 3,
    InvalidStatusTransition = 4,
}

#[contract]
pub struct DealGuardEscrowContract;

#[contractimpl]
impl DealGuardEscrowContract {
    pub fn initialize(
        env: Env,
        buyer: Address,
        seller: Address,
        moderator: Address,
        fiat_amount_cents: i128,
        asset_code: String,
        anchor: String,
        external_reference: String,
    ) {
        if env.storage().instance().has(&DataKey::Terms) {
            panic_with_error!(&env, ContractError::AlreadyInitialized);
        }
        if fiat_amount_cents <= 0 {
            panic_with_error!(&env, ContractError::InvalidAmount);
        }

        buyer.require_auth();
        moderator.require_auth();

        let terms = EscrowTerms {
            buyer,
            seller,
            moderator,
            fiat_amount_cents,
            asset_code,
            anchor,
            external_reference,
            status: EscrowStatus::Pending,
        };

        env.storage().instance().set(&DataKey::Terms, &terms);
    }

    pub fn mark_funded(env: Env, moderator: Address) {
        moderator.require_auth();
        let mut terms = Self::get_terms(env.clone());
        if terms.status != EscrowStatus::Pending {
            panic_with_error!(&env, ContractError::InvalidStatusTransition);
        }
        if terms.moderator != moderator {
            panic_with_error!(&env, ContractError::InvalidStatusTransition);
        }
        terms.status = EscrowStatus::Funded;
        env.storage().instance().set(&DataKey::Terms, &terms);
    }

    pub fn mark_released(env: Env, moderator: Address) {
        moderator.require_auth();
        let mut terms = Self::get_terms(env.clone());
        if terms.status != EscrowStatus::Funded {
            panic_with_error!(&env, ContractError::InvalidStatusTransition);
        }
        if terms.moderator != moderator {
            panic_with_error!(&env, ContractError::InvalidStatusTransition);
        }
        terms.status = EscrowStatus::Released;
        env.storage().instance().set(&DataKey::Terms, &terms);
    }

    pub fn mark_refunded(env: Env, moderator: Address) {
        moderator.require_auth();
        let mut terms = Self::get_terms(env.clone());
        if terms.status != EscrowStatus::Funded {
            panic_with_error!(&env, ContractError::InvalidStatusTransition);
        }
        if terms.moderator != moderator {
            panic_with_error!(&env, ContractError::InvalidStatusTransition);
        }
        terms.status = EscrowStatus::Refunded;
        env.storage().instance().set(&DataKey::Terms, &terms);
    }

    pub fn raise_dispute(env: Env, actor: Address) {
        actor.require_auth();
        let mut terms = Self::get_terms(env.clone());
        if actor != terms.buyer && actor != terms.seller && actor != terms.moderator {
            panic_with_error!(&env, ContractError::InvalidStatusTransition);
        }
        terms.status = EscrowStatus::Disputed;
        env.storage().instance().set(&DataKey::Terms, &terms);
    }

    pub fn get_terms(env: Env) -> EscrowTerms {
        env.storage()
            .instance()
            .get(&DataKey::Terms)
            .unwrap_or_else(|| panic_with_error!(&env, ContractError::NotInitialized))
    }
}

mod test;