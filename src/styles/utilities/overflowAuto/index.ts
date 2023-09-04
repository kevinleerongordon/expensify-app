import { ViewStyle } from 'react-native';
import OverflowAutoStyles from './types';

const overflowAuto: OverflowAutoStyles = {
    // NOTE: asserting "auto" TS type to a valid type, because isn't possible
    // to augment "overflow".
    overflow: 'auto' as ViewStyle['overflow'],
};

export default overflowAuto;
