import {ViewStyle} from 'react-native';
import {Merge} from 'type-fest';

type GetNavigationModalCardStylesParams = {isSmallScreenWidth: number};

type GetNavigationModalCardStyles = (params: GetNavigationModalCardStylesParams) => Merge<ViewStyle, Pick<ViewStyle, 'position'>>;

export default GetNavigationModalCardStyles;
