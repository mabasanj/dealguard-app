extern crate std;

use soroban_sdk::{testutils::Address as _, Address, Env, String};

use crate::{DealGuardEscrowContract, DealGuardEscrowContractClient, EscrowStatus};

#[test]
fn initializes_and_tracks_state() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(DealGuardEscrowContract, ());
    let client = DealGuardEscrowContractClient::new(&env, &contract_id);

    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);
    let moderator = Address::generate(&env);

    client.initialize(
        &buyer,
        &seller,
        &moderator,
        &150_000_i128,
        &String::from_str(&env, "ZAR"),
        &String::from_str(&env, "ZARP"),
        &String::from_str(&env, "ESC-TEST-001"),
    );

    let terms = client.get_terms();
    assert_eq!(terms.status, EscrowStatus::Pending);

    client.mark_funded(&moderator);
    let funded = client.get_terms();
    assert_eq!(funded.status, EscrowStatus::Funded);

    client.mark_released(&moderator);
    let released = client.get_terms();
    assert_eq!(released.status, EscrowStatus::Released);
}