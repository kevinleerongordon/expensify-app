import {ViewStyle} from 'react-native';
import styles from './styles';
import themeColors from './themes/default';
import variables from './variables';

type StylesArray = ViewStyle[];

const defaultWrapperStyle: ViewStyle = {
    backgroundColor: themeColors.componentBG,
};

const miniWrapperStyle: StylesArray = [
    styles.flexRow,
    defaultWrapperStyle,
    {
        borderRadius: variables.buttonBorderRadius,
        borderWidth: 1,
        borderColor: themeColors.border,
        // In Safari, when welcome messages use a code block (triple backticks), they would overlap the context menu below when there is no scrollbar without the transform style.
        // NOTE: asserting "transform" TS type to a valid type, because isn't possible
        // to augment "transform".
        transform: 'translateZ(0)' as unknown as ViewStyle['transform'],
    },
];

const bigWrapperStyle: StylesArray = [styles.flexColumn, defaultWrapperStyle];

/**
 * Generate the wrapper styles for the ReportActionContextMenu.
 *
 * @param isMini
 * @param isSmallScreenWidth
 */
function getReportActionContextMenuStyles(isMini: boolean, isSmallScreenWidth: boolean): StylesArray {
    if (isMini) {
        return miniWrapperStyle;
    }

    return [
        ...bigWrapperStyle,

        // Small screens use a bottom-docked modal that already has vertical padding.
        isSmallScreenWidth ? {} : styles.pv3,
    ];
}

export default getReportActionContextMenuStyles;
