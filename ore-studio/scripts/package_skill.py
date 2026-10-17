#!/usr/bin/env python3
"""package_skill.py

Utility to package the ore‑studio skill into a zip archive.
It collects the `ore-studio` directory (excluding __pycache__ and tests) and
writes a zip file to the `dist/` folder.
"""
import os
import zipfile
import argparse

def add_folder_to_zip(zipf, folder, base_path):
    for root, dirs, files in os.walk(folder):
        # Exclude certain directories
        dirs[:] = [d for d in dirs if d not in ('__pycache__', 'tests')]
        for file in files:
            file_path = os.path.join(root, file)
            # Compute archive name relative to base_path
            arcname = os.path.relpath(file_path, base_path)
            zipf.write(file_path, arcname)

def main():
    parser = argparse.ArgumentParser(description='Package ore‑studio skill')
    parser.add_argument('source_dir', help='Path to ore‑studio source directory')
    parser.add_argument('output_zip', help='Destination zip file')
    args = parser.parse_args()

    source_dir = os.path.abspath(args.source_dir)
    output_zip = os.path.abspath(args.output_zip)

    os.makedirs(os.path.dirname(output_zip), exist_ok=True)

    with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
        add_folder_to_zip(zipf, source_dir, os.path.dirname(source_dir))
    print(f'Packaged skill into {output_zip}')

if __name__ == '__main__':
    main()
