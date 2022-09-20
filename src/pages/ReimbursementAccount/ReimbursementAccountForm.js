import _ from 'underscore';
import React from 'react';
import PropTypes from 'prop-types';
import {View} from 'react-native';
import {withOnyx} from 'react-native-onyx';
import lodashGet from 'lodash/get';
import styles from '../../styles/styles';
import withLocalize, {withLocalizePropTypes} from '../../components/withLocalize';
import reimbursementAccountPropTypes from './reimbursementAccountPropTypes';
import compose from '../../libs/compose';
import ONYXKEYS from '../../ONYXKEYS';
import FormAlertWithSubmitButton from '../../components/FormAlertWithSubmitButton';
import FormScrollView from '../../components/FormScrollView';
import * as BankAccounts from '../../libs/actions/BankAccounts';
import * as ErrorUtils from '../../libs/ErrorUtils';

const propTypes = {
    /** Data for the bank account actively being set up */
    reimbursementAccount: reimbursementAccountPropTypes,

    /** Called when the form is submitted */
    onSubmit: PropTypes.func.isRequired,
    buttonText: PropTypes.string,
    hideSubmitButton: PropTypes.bool,
    ...withLocalizePropTypes,
};

const defaultProps = {
    reimbursementAccount: {
        isLoading: false,
        errors: {},
        errorFields: {},
    },
    buttonText: '',
    hideSubmitButton: false,
};

class ReimbursementAccountForm extends React.Component {
    componentWillUnmount() {
        BankAccounts.resetReimbursementAccount();
    }

    render() {
        const hasErrorFields = _.size(this.props.reimbursementAccount.errorFields) > 0;
        const error = _.last(_.values(this.props.reimbursementAccount.errors));
        const isErrorVisible = hasErrorFields || Boolean(error);

        const currentStep = lodashGet(
            this.props,
            'reimbursementAccount.achData.currentStep',
            CONST.BANK_ACCOUNT.STEP.BANK_ACCOUNT,
        );

        return (
            <FormScrollView
                ref={el => this.form = el}
            >
                {/* Form elements */}
                <View style={viewStyles}>
                    {this.props.children}
                </View>
                <FormAlertWithSubmitButton
                    isAlertVisible={isErrorVisible}
                    buttonText={currentStep === CONST.BANK_ACCOUNT.STEP.VALIDATION ? this.props.translate('validationStep.buttonText') : this.props.translate('common.saveAndContinue')}
                    onSubmit={this.props.onSubmit}
                    onFixTheErrorsLinkPressed={() => {
                        this.form.scrollTo({y: 0, animated: true});
                    }}
                    message={error}
                    isMessageHtml={this.props.reimbursementAccount.isErrorHtml}
                    isLoading={this.props.reimbursementAccount.loading}
                />
            </FormScrollView>
        );
    }
}

ReimbursementAccountForm.propTypes = propTypes;
ReimbursementAccountForm.defaultProps = defaultProps;
export default compose(
    withLocalize,
    withOnyx({
        reimbursementAccount: {
            key: ONYXKEYS.REIMBURSEMENT_ACCOUNT,
        },
    }),
)(ReimbursementAccountForm);
