//util functions mainly used for scatter plot (component 4)

export const ageGroupsConfig = [
    // { min: 0, max: 14, group: '0-14' },
    //need to fix data here
    { min: 15, max: 29, group: '15-29' },
    { min: 30, max: 44, group: '30-44' },
    { min: 45, max: 59, group: '45-59' },
    { min: 60, max: 74, group: '60-74' },
    { min: 75, max: 100, group: '75-100' }
];

export const indexMap = {
    'gender': 0,
    'citizenship': 1,
    'age': 2,
    'skill': 3,
    'impairment': 4,
    'occupation': 5,
    'dutycare': 6
};

//not used anywhere (scatter plot at least)
export function ageMapping(age) {
    //returns this corresponding age group when age is given
    for (let i = 0; i < ageGroupsConfig.length; i++) {
        if (age >= ageGroupsConfig[i].min && age <= ageGroupsConfig[i].max) {
            return ageGroupsConfig[i].group;
        }
    }

    return "";
}

//helper function only used in findMatchingPids()
function reverseAgeMapping(agegroup){
    let age = ageGroupsConfig.find(ageGroup => ageGroup.group === agegroup);
    return age ? { min: age.min, max: age.max } : null;

}

//bigger helper function only used in fillPidsPerCategory()
function findMatchingPids(feature, val, dataset) {
    //replaced findtest from v1
    // Normalize 'dutycare' values
    if (val === 'dutycare_Yes' || val === 'dutycare_No') {
        val = val.split('_')[1];
    }

    let similarPid = [];

    //loop replace the switch 
    dataset.forEach(element => {
        const valueIndex = indexMap[feature];
        const featureValue = element.value[valueIndex];

        if (feature === 'age') {
            const { min, max } = reverseAgeMapping(val);
            if (min <= element.value[2] && element.value[2] <= max) {
                similarPid.push(+element.pid);
            }
        } else if (featureValue === val) {
            similarPid.push(+element.pid);
        }
    });

    return similarPid;
}

export function fillPidsPerCategory(datasets, filterOptions, selectedGroups) {
    // post: 0: allpids (Me), 1: allpids_pdm1, 2: allpids_pdm2
    const result = [{}, {}, {}];

    for (let key in filterOptions) {
        const selectedOptions = selectedGroups[key];

        if (selectedOptions && selectedOptions.length > 0) {
            // At least one option is selected for this category
            datasets.forEach((dataset, i) => {
                let pids = [];

                selectedOptions.forEach(option => {
                    const matched = findMatchingPids(key, option, dataset);
                    pids = pids.concat(matched);
                });

                // Remove duplicates
                result[i][key] = [...new Set(pids)];
            });
        } else {
            // No filter selected for this category, include all options
            datasets.forEach((dataset, i) => {
                let allPids = [];

                filterOptions[key].forEach(option => {
                    const matched = findMatchingPids(key, option, dataset);
                    allPids = allPids.concat(matched);
                });

                result[i][key] = [...new Set(allPids)];
            });
        }
    }

    return result;
}

export function findcommonpids(pidLists) {
    if (!pidLists.length) return [];

    return pidLists.reduce((acc, list) =>
        acc.filter(pid => list.includes(pid))
    );
}

const normalizationConfig = {
    //with bias considered
    // const minVal = -1.61;
    // const maxVal = 0.71;
    // const bias = 0.1;

    //without bias
    // const maxVal = 0.61;
    // const range = maxVal - minVal || 1; 
    min: -1.71,
    scaleFactor: 50,
    offset: 50,
};

export function getBiasTerm(biasedScore) {
    const minVal = -1.61;
    const maxVal = 0.71;
    const range = maxVal - minVal || 1; // Avoid division by zero
    const bias = 0.1;

    const finalScore = ((biasedScore - minVal) / range);

    const biasPortion = bias / biasedScore;
    const biasContribution = biasPortion * finalScore;
    return biasContribution;

}

export function normalize(amsScore, flatArray = false) {
    //bias cal here
    // const bias = 0;
    // const biasedScore = rawScore + bias;
    // const finalScore = ((biasedScore - min) / range);


    // const biasContribution = (bias / biasedScore) * finalScore;

    // const contributionPortion = (rawScore / biasedScore) * finalScore;

    // //important: add the biasContribution/7 term at the end of each contribution
    // let contributions = scoredistribution.map(val => {
    //   return (val / rawScore) * contributionPortion ;
    // });
    // biasContribution/7

    // with bias
    // if(fullformat===true){
    //   return amsScore.map(entry => ({
    //     ...entry,
    //     total: (entry.total - minVal) / range
    //   }));

    // }

    // return amsScore.map(entry => ({
    //   ...entry,
    //   value: (entry.value - minVal) / range
    // }));

    //new, ignored bias
    //a twist to the min/max normalization
    if (flatArray === true) {
        return amsScore.map(score => ((score / -normalizationConfig.min) * normalizationConfig.scaleFactor + normalizationConfig.offset / 7) / 100);

    }
    // not used in scatter plot
    // if (fullformat === true) {
    //     return amsScore.map(entry => ({
    //         ...entry,
    //         total: (entry.total / - normalizationConfig.min) * normalizationConfig.scaleFactor + normalizationConfig.offset
    //     }));

    // }
    return amsScore.map(entry => ({
        ...entry,
        value: (entry.value / - normalizationConfig.min) * normalizationConfig.scaleFactor + normalizationConfig.offset
    }));

}

function getScoreDist(profile, detailedScore) {
    const match = detailedScore.find(el => el.pid === profile.pid);

    if (match) {
        return match.value
    }

}

export function linkProfileCard(scoreDataMap, profile, selectedEntry, pool){
    //link the entry to the dummy card
    const [gender, citizenship, age, skill, impairment, occupation, dutycare] = selectedEntry.value;

    Object.assign(profile, {
        pid: selectedEntry.pid,
        gender,
        citizenship,
        age,
        skill,
        impairment,
        occupation,
        dutycare,
        pool
    });


    const selectedScoreData = scoreDataMap[pool];
    let scoredistribution = getScoreDist(profile, selectedScoreData);
    //find the correct distribution

    
    //calculation sum of for each contribution
    const rawScore = scoredistribution.reduce((sum, val) => sum + val, 0);


    let contributions;
    if (rawScore === 0) {
        contributions = new Array(7).fill(0);
    } else {
        console.log("this is a contribution", scoredistribution)
        contributions = normalize(scoredistribution, true)
    }

    return contributions;

}


export function computeDensityPositions(xScale, data, category) {
    //shouldnt change anymore
    const startX = xScale(category) + 3;
    const dotSpacing = 6.6;

    // Preprocess for density
    const valueCounts = {};
    data.forEach(d => {
        const val = d.value.toFixed(3);
        if (!valueCounts[val]) valueCounts[val] = [];
        valueCounts[val].push(d);
    });

    // Assign _xDensity to each datum
    //modifying data directly
    Object.values(valueCounts).forEach(group => {
        //to center align the dots here
        // const count = group.length;
        // const offset = (count - 1) / 2;
        group.forEach((d, i) => {
            d._xDensity = startX + i * dotSpacing;
        });
    });
}

