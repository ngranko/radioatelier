package middleware

import (
    "context"
    "net/http"

    "radioatelier/package/adapter/auth/accessToken"
    "radioatelier/package/infrastructure/router"
)

func VerifyAccessToken(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        cookie, err := r.Cookie("jwt")
        if err != nil {
            router.NewResponse().
                WithStatus(http.StatusUnauthorized).
                WithPayload(router.Payload{Message: "Auth token not provided"}).
                Send(w)
            return
        }

        token, err := accessToken.NewFromEncoded(cookie.Value)
        if err != nil {
            router.NewResponse().
                WithStatus(http.StatusUnauthorized).
                WithPayload(router.Payload{Message: "Auth token is invalid"}).
                Send(w)
            return
        }

        err = token.Verify()
        if err != nil {
            router.NewResponse().
                WithStatus(http.StatusUnauthorized).
                WithPayload(router.Payload{Message: "Auth token is invalid"}).
                Send(w)
            return
        }

        ctx := context.WithValue(r.Context(), "Token", token)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

func RequireVerifiedAccessTokenUser(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        token := r.Context().Value("Token").(accessToken.AccessToken)

        verified := token.UserVerified()
        if !verified {
            router.NewResponse().
                WithStatus(http.StatusForbidden).
                WithPayload(router.Payload{Message: "User is not verified, access restricted"}).
                Send(w)
            return
        }

        next.ServeHTTP(w, r)
    })
}

//func VerifyRefreshToken(next http.Handler) http.Handler {
//    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
//        header := r.Header.Get("Authorization")
//        if len(header) < 7 || strings.ToLower(header[0:6]) != "bearer" {
//            // TODO: do I need to invalidate JWT cookie at this point?
//            router.NewResponse().
//                WithStatus(http.StatusUnauthorized).
//                WithPayload(router.Payload{Message: "Token not provided"}).
//                Send(w)
//            return
//        }
//
//        token, err := service.NewRefreshTokenService().Verify(header[7:])
//        if err != nil {
//            if err.Type() == errors.DataNotFoundType {
//                // TODO: do I need to invalidate JWT cookie at this point?
//                router.NewResponse().
//                    WithStatus(http.StatusUnauthorized).
//                    WithPayload(router.Payload{Message: "Token not found in the database"}).
//                    Send(w)
//                return
//            }
//
//            if err.Type() == errors.RefreshTokenErrorType {
//                // TODO: do I need to invalidate JWT cookie at this point?
//                err := repository.NewRefreshTokenRepository(db.Get()).DeleteTokenFamily(token)
//                if err != nil {
//                    logger.GetZerolog().Error("failed to invalidate refresh token family", slog.Any("error", err))
//                }
//                router.NewResponse().
//                    WithStatus(http.StatusUnauthorized).
//                    WithPayload(router.Payload{Message: "Token is invalid"}).
//                    Send(w)
//                return
//            }
//        }
//
//        ctx := context.WithValue(r.Context(), "RefreshToken", token)
//        next.ServeHTTP(w, r.WithContext(ctx))
//    })
//}
