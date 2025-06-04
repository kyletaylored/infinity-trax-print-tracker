import fs from 'fs';
import path from 'path';

/**
 * Normalize the name of a part.
 * @param {string} name - The name of the part.
 * @returns {string} - The normalized name of the part.
 */
function normalizeName(name) {
    return name.toLowerCase().replace(/[\s_.]+/g, '-').replace(/[^a-z0-9-]/g, '');
}

/**
 * Get the description of a part.
 * @param {string} partId - The id of the part.
 * @returns {string} - The description of the part.
 */
async function getDescription(partId) {

    const descriptions = {
        "archimedes-racing": "Switch to start the race.",
        "archimedes-screw-lift-extension": "Up to 5 modular extensions can be added to each powered screw lift.",
        "archimedes-screw-lift": "Return your marble to the top for an endless loop.",
        "audio": "Record anything you want and it plays when the marble goes through the tunnel.",
        "led": "Lights up when a marble hits it. How cool is that?",
        "stairs": "Every single step forward is important.",
        "hill": "Journey over obstacles to reach your destination.",
        "mini-straight": "A mini straight section to get your marble moving.",
        "arm": "A simple arm to move your marble to the next section.",
        "curve": "Gently redirect your marble to the next section.",
        "mini-bend": "A smaller curve to get your marble moving.",
        "switchback": "Sometimes going backwards is the best way to go forward.",
        "switch": "Take a different path to your destination.",
        "orbit": "Round and round we go until we run out of energy and move onto the next plane.",
        "flex": "The perfect track section for free form design.",
        "corner": "Go around corners with ease.",
        "wheel": "Go round and round.",
        "third-dimension": "Route around obstacles in 3D.",
        "valley": "Whenever we go down, we always come out the other side.",
        "double-back-flip": "Make it go upside down!",
        "manual-launcher": "Launch your marble manually.",
        "flip-down-letters-letters": "A fun way to spell out your message.",
        "flip-down-letters-letter-mechanism": "The mechanism that makes the letters flip down.",
        "straight": "Key component to building larger tracks.",
        "start": "The start of the track!",
        "overtaking": "Entering the overtaking maze in first place means very little.",
        "zig-zag": "A zig-zag section to get your marble moving.",
    };

    for (const id of Object.keys(descriptions)) {
        if (partId.toLowerCase().includes(id)) {
            return descriptions[id];
        }
    }

    return 'Generic part.';
}

/**
 * Get the image of a part.
 * @param {string} partId - The id of the part.
 * @returns {string} - The image of the part.
 */
function getImage(partId) {
    let image = partId;

    if (partId.includes('mini-bend')) {
        image = 'curve';
    }
    if (partId.includes('flip-down-letters')) {
        image = 'letters';
    }
    if (partId === 'orbit-right' || partId === 'orbit-left') {
        image = 'orbit';
    }
    if (partId.includes('orbit-return')) {
        image = 'orbit-return';
    }
    if (partId.includes('archimedes-screw-lift-extension-left') || partId.includes('archimedes-screw-lift-extension-right')) {
        image = 'archimedes-screw-lift-extension';
    }
    if (partId.includes('archimedes-screw-lift') && !partId.includes('extension')) {
        image = 'archimedes-screw-lift';
    }
    if (partId.includes('overtaking-section')) {
        image = 'overtaking-section';
    }
    if (partId.includes('third-dimension')) {
        image = 'third-dimension';
    }

    return `images/${image}.png`;
}
/**
 * Parse the metadata of a part.
 * @param {string} fileName - The name of the file.
 * @returns {Object} - The metadata of the part.
 */
function parseFileName(fileName) {
    const metadata = {
        support: false,
        brim: false,
        optional: false,
        color_type: "A",
        infill: "15%"
    };

    if (fileName.includes('-B')) {
        metadata.color_type = 'B';
    }
    if (fileName.toLowerCase().includes('support')) {
        metadata.support = true;
    }
    if (fileName.toLowerCase().includes('infill')) {
        const infillMatch = fileName.match(/\d+/);
        if (infillMatch) {
            metadata.infill = infillMatch[0] + "%";
        }
    }
    if (fileName.toLowerCase().includes('brim')) {
        metadata.brim = true;
    }
    if (fileName.toLowerCase().includes('optional')) {
        metadata.optional = true;
    }

    return metadata;
}

/**
 * Generate the part data.
 * @param {string} baseDir - The base directory of the parts.
 * @returns {Array} - The part data.
 */
async function generatePartData(baseDir) {
    const parts = [];
    let totalFiles = 0;
    let processedFiles = 0;

    const directories = fs.readdirSync(baseDir).filter(dir => {
        return fs.statSync(path.join(baseDir, dir)).isDirectory() && !dir.startsWith('.');
    });

    directories.forEach(partDir => {
        const partPath = path.join(baseDir, partDir);
        const subDirectories = fs.readdirSync(partPath).filter(subDir => {
            return fs.statSync(path.join(partPath, subDir)).isDirectory() && !subDir.startsWith('.');
        });

        if (subDirectories.length > 0) {
            subDirectories.forEach(subDir => {
                const subDirPath = path.join(partPath, subDir);
                const files = fs.readdirSync(subDirPath).filter(file => !file.startsWith('.'));
                totalFiles += files.length;
            });
        } else {
            const files = fs.readdirSync(partPath).filter(file => !file.startsWith('.'));
            totalFiles += files.length;
        }
    });

    for (const partDir of directories) {
        const partPath = path.join(baseDir, partDir);
        const subDirectories = fs.readdirSync(partPath).filter(subDir => {
            return fs.statSync(path.join(partPath, subDir)).isDirectory() && !subDir.startsWith('.');
        });

        if (subDirectories.length > 0) {
            for (const subDir of subDirectories) {
                const subDirPath = path.join(partPath, subDir);
                const id = normalizeName(partDir + '-' + subDir);
                const part = await processDirectory(subDirPath, partDir, subDir, id);
                parts.push(part);
                processedFiles += part.sub_parts.length;
            }
        } else {
            const id = normalizeName(partDir);
            const part = await processDirectory(partPath, partDir, '', id);
            parts.push(part);
            processedFiles += part.sub_parts.length;
        }

        console.log(`Processed: ${processedFiles}/${totalFiles} (${((processedFiles / totalFiles) * 100).toFixed(2)}%)`);
    }

    parts.forEach(part => {
        if (part.id.includes('flip-down-letters-letters')) {
            part.dependencies.push('flip-down-letters-letter-mechanism');
        }
        if (part.id.includes('orbit-right')) {
            part.dependencies.push('orbit-return-right');
        }
        if (part.id.includes('orbit-left')) {
            part.dependencies.push('orbit-return-left');
        }
        if (part.id.includes('archimedes-screw-lift-extension-left')) {
            part.dependencies.push('archimedes-screw-lift-left');
        }
        if (part.id.includes('archimedes-screw-lift-extension-right')) {
            part.dependencies.push('archimedes-screw-lift-right');
        }
    });

    return parts;
}

/**
 * Process a directory of parts.
 * @param {string} dirPath - The path to the directory.
 * @param {string} partDir - The name of the part.
 * @param {string} subDir - The name of the subdirectory.
 * @param {string} id - The id of the part.
 * @returns {Object} - The part data.
 */
async function processDirectory(dirPath, partDir, subDir, id) {
    const part = {
        id: id,
        name: subDir ? `${partDir.replace(/[_-]/g, ' ')} - ${subDir}` : `${partDir.replace(/[_-]/g, ' ')}`,
        image: getImage(id),
        metadata: {
            orientation: subDir.toLowerCase().includes('left') ? 'left' : subDir.toLowerCase().includes('right') ? 'right' : 'none',
            description: await getDescription(id)
        },
        dependencies: [],
        sub_parts: []
    };

    const files = fs.readdirSync(dirPath).filter(file => !file.startsWith('.'));
    for (const file of files) {
        const metadata = parseFileName(file);
        const subPart = {
            id: normalizeName(file),
            name: file,
            metadata
        };
        part.sub_parts.push(subPart);
    }

    return part;
}

/**
 * Main function.
 * @returns {void}
 */
(async () => {
    try {
        const directory = process.argv[2];
        if (!directory) {
            console.error('Please provide a directory path as an argument.');
            return;
        }

        const parts = await generatePartData(directory);
        fs.writeFileSync('./src/data/parts-list.json', JSON.stringify(parts, null, 4));
        console.log('JSON generated successfully!');
    } catch (error) {
        console.error('Error generating JSON:', error);
    }
})();