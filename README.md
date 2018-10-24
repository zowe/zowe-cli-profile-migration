# Profile migration

This Zowe utility allows existing profiles to be migrated from a previous version of Zowe CLI where keytar was used.

Involves the migration of profiles from the .brightside directory to the .zowe directory.

* Profile directories are created, as needed.
* Profile files are copied, overwriting if the same file is found under .zowe directory tree.
* Secured properties are read from the secured credentials store and written in plain text in the profile file in the destination directory.
* Optional: Deletes the old profile(s) from .brightside and the secured credentials store. (Uncomment the line as noted in the code if the old profile files and stored credentials should be deleted.)

NOTE: A Windows script is also provided to remove credentials from the operating system.

* WindowsSecureCredentialsCleanup.bat removes credentials from the Windows Vault.