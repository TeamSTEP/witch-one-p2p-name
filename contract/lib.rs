#![cfg_attr(not(feature = "std"), no_std)]

#[ink::contract]
mod p2p_name_service {
    use ink::storage::Mapping;

    /// Emitted whenever a new name is being registered.
    #[ink(event)]
    pub struct Register {
        #[ink(topic)]
        name: Hash,
        #[ink(topic)]
        from: AccountId,
    }

    /// Emitted whenever a name is being transferred.
    #[ink(event)]
    pub struct Transfer {
        #[ink(topic)]
        name: Hash,
        from: AccountId,
        #[ink(topic)]
        old_owner: Option<AccountId>,
        #[ink(topic)]
        new_owner: AccountId,
    }

    #[ink(event)]
    pub struct TransferAdmin {
        #[ink(topic)]
        from: AccountId,
        #[ink(topic)]
        new_admin: AccountId,
    }

    /// P2P Name Service is a simple contract for associating a name with an address.
    #[ink(storage)]
    pub struct P2pNameService {
        /// A hashmap to store all name to addresses mapping.
        name_to_address: Mapping<Hash, AccountId>,
        /// A hashmap to store all the address to the name.
        address_to_name: Mapping<AccountId, Hash>,
        /// The default address.
        default_address: AccountId,
        /// The admin address.
        admin_address: AccountId,
    }

    impl Default for P2pNameService {
        fn default() -> Self {
            // note: This is duplicate code from the constructor. We need to remove it.
            let mut name_to_address = Mapping::new();
            name_to_address.insert(Hash::default(), &zero_address());
            let mut address_to_name = Mapping::new();
            address_to_name.insert(zero_address(), &Hash::default());

            Self {
                name_to_address,
                address_to_name,
                default_address: zero_address(),
                admin_address: zero_address(),
            }
        }
    }

    /// Errors that can occur upon calling this contract.
    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(::scale_info::TypeInfo))]
    pub enum Error {
        /// Returned if the name already exists upon registration.
        NameAlreadyExists,
        /// Returned if the account already has a name.
        AccountAlreadyHasName,
        /// Returned if caller is not owner while required to.
        CallerIsNotOwner,
        /// Returned if the caller is not the admin account.
        CallerIsNotAdmin,
    }

    /// Type alias for the contract's result type.
    pub type Result<T> = core::result::Result<T, Error>;

    impl P2pNameService {
        /// Creates a new domain name service contract.
        #[ink(constructor)]
        pub fn new() -> Self {
            let admin_address = Self::env().caller();
            let mut name_to_address = Mapping::new();
            name_to_address.insert(Hash::default(), &zero_address());
            let mut address_to_name = Mapping::new();
            address_to_name.insert(zero_address(), &Hash::default());

            Self {
                name_to_address,
                address_to_name,
                default_address: zero_address(),
                admin_address,
            }
        }

        /// Register specific name with caller as owner.
        #[ink(message)]
        pub fn register(&mut self, name: Hash) -> Result<()> {
            let caller = self.env().caller();
            if self.name_has_owner(name) {
                return Err(Error::NameAlreadyExists);
            }

            if self.account_has_name(caller) {
                return Err(Error::AccountAlreadyHasName)
            }

            self.set_account_name(caller, name)?;

            self.env().emit_event(Register { name, from: caller });

            Ok(())
        }

        /// Set address for specific name.
        #[ink(message)]
        pub fn force_register(&mut self, name: Hash, to: AccountId) -> Result<()> {
            let caller = self.env().caller();
            let admin = self.admin_address;
            if caller != admin {
                return Err(Error::CallerIsNotAdmin);
            }

            if self.name_has_owner(name) {
                return Err(Error::NameAlreadyExists);
            }

            if self.account_has_name(to) {
                return Err(Error::AccountAlreadyHasName)
            }

            self.set_account_name(to, name)?;

            self.env().emit_event(Register { name, from: caller });
            Ok(())
        }

        /// Transfer owner to another address.
        #[ink(message)]
        pub fn transfer(&mut self, name: Hash, to: AccountId) -> Result<()> {
            let caller = self.env().caller();
            let owner = self.get_owner_of_or_default(name);
            if caller != owner {
                return Err(Error::CallerIsNotOwner);
            }

            if self.account_has_name(to) {
                return Err(Error::AccountAlreadyHasName)
            }

            self.remove_account_name(owner, name)?;
            self.set_account_name(to, name)?;

            let old_owner = self.name_to_address.get(name);

            self.env().emit_event(Transfer {
                name,
                from: caller,
                old_owner,
                new_owner: to,
            });

            Ok(())
        }

        /// Force transfer a name from one account to another. If the origin is not admin, it will fail.
        #[ink(message)]
        pub fn force_transfer(&mut self, name: Hash, from: AccountId, to: AccountId) -> Result<()> {
            let caller = self.env().caller();
            let owner = self.get_owner_of_or_default(name);

            if caller != self.admin_address {
                return Err(Error::CallerIsNotAdmin);
            }

            if from != owner {
                return Err(Error::CallerIsNotOwner);
            }

            if self.account_has_name(to) {
                return Err(Error::AccountAlreadyHasName)
            }

            self.remove_account_name(owner, name)?;
            self.set_account_name(to, name)?;

            let old_owner = self.name_to_address.get(name);

            self.env().emit_event(Transfer {
                name,
                from: caller,
                old_owner,
                new_owner: to,
            });

            Ok(())
        }

        /// Transfer the admin account to a different account.
        #[ink(message)]
        pub fn transfer_admin(&mut self, new_admin: AccountId) -> Result<()> {
            let caller = self.env().caller();

            if caller != self.admin_address {
                return Err(Error::CallerIsNotAdmin);
            }

            // todo: need to check if `new_admin` is already admin

            self.admin_address = new_admin;

            self.env().emit_event(TransferAdmin {
                from: caller,
                new_admin,
            });

            Ok(())
        }

        /// Get the current admin of the contract.
        #[ink(message)]
        pub fn get_admin(&self) -> AccountId {
            self.admin_address
        }

        /// Get the name of the given address.
        #[ink(message)]
        pub fn name_of(&self, address: AccountId) -> Hash {
            self.get_name_of_or_default(address)
        }

        /// Get the owner of the given name.
        #[ink(message)]
        pub fn owner_of(&self, name: Hash) -> AccountId {
            self.get_owner_of_or_default(name)
        }

        /// Get the name of the given address or the default name.
        fn get_name_of_or_default(&self, address: AccountId) -> Hash {
            self.address_to_name.get(address).unwrap_or(Hash::default())
        }

        /// Get the owner of the given name or the default address.
        fn get_owner_of_or_default(&self, name: Hash) -> AccountId {
            self.name_to_address
                .get(name)
                .unwrap_or(self.default_address)
        }

        /// Register the link between the name and the account.
        fn set_account_name(&mut self, address: AccountId, name: Hash) -> Result<()> {
            self.name_to_address.insert(name, &address);
            self.address_to_name.insert(address, &name);

            Ok(())
        }

        /// Remove the registered name and the account.
        fn remove_account_name(&mut self, account: AccountId, name: Hash) -> Result<()> {
            self.name_to_address.insert(name, &self.default_address);
            self.address_to_name.insert(account, &Hash::default());

            Ok(())
        }

        /// Check if the given name has an owner.
        fn name_has_owner(&self, name: Hash) -> bool {
            let address = self
                .name_to_address
                .get(name)
                .unwrap_or(self.default_address);

            if address == self.default_address {
                return false;
            }

            let fetched_name = self.address_to_name.get(address).unwrap_or(Hash::default());

            if fetched_name == Hash::default() {
                return false;
            }

            true
        }

        // Check if the given account already has a name.
        fn account_has_name(&self, account: AccountId) -> bool {
            let name = self
                .address_to_name
                .get(account)
                .unwrap_or(Hash::default());

            if name == Hash::default() {
                return false;
            }

            let fetched_account = self.name_to_address.get(name).unwrap_or(self.default_address);

            if fetched_account == self.default_address {
                return false;
            }

            true
        }
    }

    /// Helper for referencing the zero address (`0x00`). Note that in practice this address should
    /// not be treated in any special way (such as a default placeholder) since it has a known
    /// private key.
    fn zero_address() -> AccountId {
        [0u8; 32].into()
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        fn default_accounts() -> ink::env::test::DefaultAccounts<ink::env::DefaultEnvironment> {
            ink::env::test::default_accounts::<Environment>()
        }

        fn set_next_caller(caller: AccountId) {
            ink::env::test::set_caller::<Environment>(caller);
        }

        #[ink::test]
        fn register_works() {
            let accounts = default_accounts();
            let name = Hash::from([0x99; 32]);
            let another_name = Hash::from([0x88; 32]);

            set_next_caller(accounts.alice);
            let mut contract = P2pNameService::new();

            assert_eq!(contract.register(name), Ok(()));
            assert_eq!(contract.register(name), Err(Error::NameAlreadyExists));
            assert_eq!(contract.register(another_name), Err(Error::AccountAlreadyHasName));
        }

        #[ink::test]
        fn force_register_works() {
            let accounts = default_accounts();
            let name = Hash::from([0x99; 32]);
            let another_name = Hash::from([0x88; 32]);

            set_next_caller(accounts.alice);
            let mut contract = P2pNameService::new();

            assert_eq!(contract.get_admin(), accounts.alice);

            set_next_caller(accounts.bob);
            assert_eq!(
                contract.force_register(name, accounts.bob),
                Err(Error::CallerIsNotAdmin)
            );

            set_next_caller(accounts.alice);
            assert_eq!(contract.force_register(name, accounts.bob), Ok(()));
            assert_eq!(contract.force_register(another_name, accounts.bob), Err(Error::AccountAlreadyHasName));
        }

        #[ink::test]
        fn transfer_works() {
            let accounts = default_accounts();
            let name = Hash::from([0x99; 32]);
            let another_name = Hash::from([0x88; 32]);

            set_next_caller(accounts.alice);

            let mut contract = P2pNameService::new();
            assert_eq!(contract.register(name), Ok(()));

            assert_eq!(contract.owner_of(name), accounts.alice);

            // Test transfer of owner.
            assert_eq!(contract.transfer(name, accounts.bob), Ok(()));

            assert_eq!(contract.owner_of(name), accounts.bob);

            assert_eq!(contract.transfer(name, accounts.charlie), Err(Error::CallerIsNotOwner));

            set_next_caller(accounts.bob);
            assert_eq!(contract.register(another_name), Err(Error::AccountAlreadyHasName));
            assert_eq!(contract.transfer(name, accounts.charlie), Ok(()));
            assert_eq!(contract.name_of(accounts.charlie), name);
        }

        #[ink::test]
        fn force_transfer_works() {
            let accounts = default_accounts();
            let name = Hash::from([0x99; 32]);
            let another_name = Hash::from([0x88; 32]);

            set_next_caller(accounts.alice);

            let mut contract = P2pNameService::new();
            assert_eq!(contract.get_admin(), accounts.alice);

            assert_eq!(contract.force_register(name, accounts.bob), Ok(()));
            
            assert_eq!(contract.name_of(accounts.bob), name);

            assert_eq!(contract.force_transfer(name, accounts.alice, accounts.bob), Err(Error::CallerIsNotOwner));

            assert_eq!(contract.force_transfer(name, accounts.bob, accounts.charlie), Ok(()));

            assert_eq!(contract.owner_of(name), accounts.charlie);

            set_next_caller(accounts.charlie);

            assert_eq!(contract.transfer(name, accounts.alice), Ok(()));

            assert_eq!(contract.owner_of(name), accounts.alice);

            assert_eq!(contract.force_transfer(name, accounts.alice, accounts.bob), Err(Error::CallerIsNotAdmin));

            assert_eq!(contract.register(another_name), Ok(()));

            set_next_caller(accounts.alice);

            assert_eq!(contract.force_transfer(another_name, accounts.charlie, accounts.alice), Err(Error::AccountAlreadyHasName));
        }

        #[ink::test]
        fn admin_transfer_works() {
            let accounts = default_accounts();
            
            set_next_caller(accounts.alice);

            let mut contract = P2pNameService::new();

            assert_eq!(contract.get_admin(), accounts.alice);

            set_next_caller(accounts.bob);

            assert_eq!(contract.transfer_admin(accounts.charlie), Err(Error::CallerIsNotAdmin));

            set_next_caller(accounts.alice);

            assert_eq!(contract.transfer_admin(accounts.bob), Ok(()));

            assert_eq!(contract.get_admin(), accounts.bob);
        }
    }
}
