function resolveLater(value, ms = 0) {
    return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

exports.users = {
    staticUser: {
        accepted: false,
        sendAlteredMessage(isAccept) {
            this.accepted = isAccept;
            return resolveLater(this);
        },
        findBySlackId() {
            return resolveLater(this.staticUser, 50);
        }
    }
}