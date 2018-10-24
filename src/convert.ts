/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { CredentialManagerFactory, DefaultCredentialManager, CliProfileManager, IProfileLoaded, BasicProfileManager } from "@brightside/imperative";
import { join } from "path";

const homedir = require('os').homedir();
const fs = require('fs');
const path = require('path');

const source = homedir + "/.brightside/profiles";
const dest = homedir + "/.zowe";

(async () => {
    // create/copy directories/files from .brightside to .zowe

    // variable 'profiles' will contain the high level directories under the 'profiles' directory
    // which maps to the profile types
    const profiles = copyFolderRecursiveSync(source, dest);

    await CredentialManagerFactory.initialize(DefaultCredentialManager, "@brightside/core");

    // loop through the profile types and re-write the profile files with clear text
    for (let i = 0; i < profiles.length; i++) {
        // load the profiles which will retrieve values of properties that are securely stored
        const zoweProfile: IProfileLoaded[] = await new CliProfileManager({
            profileRootDirectory: source,
            type: profiles[i]
        }).loadAll();

        // basic will be used to update the profiles in the .zowe/profiles/* folder(s) with plain text
        const basicProfManager = new BasicProfileManager({
            profileRootDirectory: join(dest, "profiles"),
            type: profiles[i]
        });

        // cli will be used delete the 'old' profiles and remove the secured credentials and remove
        // the profile file
        const cliProfManager = new CliProfileManager({
            profileRootDirectory: source,
            type: profiles[i]
        });

        // update the profile files with secure property values written in plain text
        for (const prof of zoweProfile) {
            if (prof.type === profiles[i]) {
                await basicProfManager.save({
                    overwrite: true,
                    profile: prof.profile
                });

                // NOTE: uncomment the line below to have the .brightside profiles
                // deleted (secure credentials store and files)
                // await cliProfManager.delete({name: prof.profile.name});
            }
        }
    }

    /**
     * Copy the file
     * @param source - the directory/file to copy
     * @param target - the directory to which to copy the file
     */
    function copyFileSync(source: string, target: string) {

        let targetFile = target;

        //if target is a directory a new file with the same name will be created
        if ( fs.existsSync( target ) ) {
            if ( fs.lstatSync( target ).isDirectory() ) {
                targetFile = path.join( target, path.basename( source ) );
            }
        }

        fs.writeFileSync(targetFile, fs.readFileSync(source));
    }

    /**
     * Create destination directory from source
     * @param source - the source directory path
     * @param target - the target directory path for the copied directory
     */
    function copyFolderRecursiveSync(source: string, target: string) {
        let files = [];

        //check if folder needs to be created or integrated
        const targetFolder = path.join( target, path.basename( source ) );
        if ( !fs.existsSync( targetFolder ) ) {
            fs.mkdirSync( targetFolder );
        }

        //copy file or create subdirectory
        if ( fs.lstatSync( source ).isDirectory() ) {
            files = fs.readdirSync( source );
            files.forEach( function ( file: string ) {
                const curSource = path.join( source, file );
                if ( fs.lstatSync( curSource ).isDirectory() ) {
                    copyFolderRecursiveSync( curSource, targetFolder );
                } else {
                    copyFileSync( curSource, targetFolder );
                }
            } );
        }

        // first invocation will return the list of folders that map to the
        // profile types that may be defined
        if (path.basename(source) === "profiles"){
            return files;
        }

    }
})();
