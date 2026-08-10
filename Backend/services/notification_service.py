def send_notification(
    recipient: str,
    message: str
) -> dict:

    print(
        f"[NOTIFICATION] Sending to {recipient}"
    )

    print(
        f"[MESSAGE] {message}"
    )

    return {
        "success": True,
        "recipient": recipient,
        "message": message,
        "status": "DISPATCHED"
    }


def send_sos_notification(
    sos_id: str,
    priority: str
) -> dict:

    message = (
        f"Emergency SOS {sos_id} "
        f"has been dispatched with "
        f"{priority} priority."
    )

    return send_notification(
        recipient="Emergency Response Team",
        message=message
    )