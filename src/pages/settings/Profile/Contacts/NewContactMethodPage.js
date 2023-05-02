import React, {
    useCallback, useMemo, useRef, useState,
} from 'react';
import PropTypes from 'prop-types';
import {View} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';
import {withOnyx} from 'react-native-onyx';
import {compose} from 'underscore';
import lodashGet from 'lodash/get';
import Str from 'expensify-common/lib/str';
import Button from '../../../../components/Button';
import FixedFooter from '../../../../components/FixedFooter';
import HeaderWithBackButton from '../../../../components/HeaderWithBackButton';
import ScreenWrapper from '../../../../components/ScreenWrapper';
import Text from '../../../../components/Text';
import TextInput from '../../../../components/TextInput';
import withLocalize, {withLocalizePropTypes} from '../../../../components/withLocalize';
import Navigation from '../../../../libs/Navigation/Navigation';
import Permissions from '../../../../libs/Permissions';
import ONYXKEYS from '../../../../ONYXKEYS';
import ROUTES from '../../../../ROUTES';
import styles from '../../../../styles/styles';
import * as User from '../../../../libs/actions/User';
import * as LoginUtils from '../../../../libs/LoginUtils';

const propTypes = {
    /* Onyx Props */

    /** List of betas available to current user */
    betas: PropTypes.arrayOf(PropTypes.string),

    /** Login list for the user that is signed in */
    loginList: PropTypes.shape({
        /** The partner creating the account. It depends on the source: website, mobile, integrations, ... */
        partnerName: PropTypes.string,

        /** Phone/Email associated with user */
        partnerUserID: PropTypes.string,

        /** The date when the login was validated, used to show the brickroad status */
        validatedDate: PropTypes.string,

        /** Field-specific server side errors keyed by microtime */
        errorFields: PropTypes.objectOf(PropTypes.objectOf(PropTypes.string)),

        /** Field-specific pending states for offline UI status */
        pendingFields: PropTypes.objectOf(PropTypes.objectOf(PropTypes.string)),
    }),

    ...withLocalizePropTypes,
};
const defaultProps = {
    betas: [],
    loginList: {},
};

function NewContactMethodPage(props) {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const loginInputRef = useRef(null);

    const handleLoginChange = useCallback((value) => {
        setLogin(value.trim());
    }, []);

    const handlePasswordChange = useCallback((value) => {
        setPassword(value.trim());
    }, []);

    const isFormValid = useMemo(() => {
        const phoneLogin = LoginUtils.getPhoneNumberWithoutSpecialChars(login);

        return (Permissions.canUsePasswordlessLogins(props.betas) || password)
            && (Str.isValidEmail(login) || Str.isValidPhone(phoneLogin));
    }, [login, password, props.betas]);

    const submitForm = useCallback(() => {
        // If this login already exists, just go back.
        if (lodashGet(props.loginList, login)) {
            Navigation.navigate(ROUTES.SETTINGS_CONTACT_METHODS);
            return;
        }
        User.addNewContactMethodAndNavigate(login, password);
    }, [login, props.loginList, password]);

    return (
        <ScreenWrapper
            onTransitionEnd={() => {
                if (!loginInputRef.current) {
                    return;
                }
                loginInputRef.current.focus();
            }}
        >
            <HeaderWithBackButton
                title={props.translate('contacts.newContactMethod')}
                onBackButtonPress={() => Navigation.goBack(ROUTES.SETTINGS_CONTACT_METHODS)}
            />
            <ScrollView>
                <Text style={[styles.ph5, styles.mb5]}>
                    {props.translate('common.pleaseEnterEmailOrPhoneNumber')}
                </Text>
                <View style={[styles.ph5, styles.mb6]}>
                    <TextInput
                        label={`${props.translate('common.email')}/${props.translate('common.phoneNumber')}`}
                        ref={loginInputRef}
                        value={login}
                        onChangeText={handleLoginChange}
                        autoCapitalize="none"
                        returnKeyType={Permissions.canUsePasswordlessLogins(props.betas) ? 'done' : 'next'}
                    />
                </View>
                {!Permissions.canUsePasswordlessLogins(props.betas)
                    && (
                        <View style={[styles.ph5, styles.mb6]}>
                            <TextInput
                                label={props.translate('common.password')}
                                value={password}
                                onChangeText={handlePasswordChange}
                                returnKeyType="done"
                            />
                        </View>
                    )}
            </ScrollView>
            <FixedFooter style={[styles.flexGrow0]}>
                <Button
                    success
                    isDisabled={!isFormValid}
                    text={props.translate('common.add')}
                    onPress={submitForm}
                    pressOnEnter
                />
            </FixedFooter>
        </ScreenWrapper>
    );
}

NewContactMethodPage.propTypes = propTypes;
NewContactMethodPage.defaultProps = defaultProps;

export default compose(
    withLocalize,
    withOnyx({
        betas: {key: ONYXKEYS.BETAS},
        loginList: {key: ONYXKEYS.LOGIN_LIST},
    }),
)(NewContactMethodPage);
