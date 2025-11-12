package com.hostelcomplaintresolver.backend.config.filter;

import com.hostelcomplaintresolver.backend.util.JwtUtil;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.SignatureException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class JwtRequestFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        final String authorizationHeader = request.getHeader("Authorization");

        String username = null;
        String jwt = null;
        List<String> roles = null;

        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            jwt = authorizationHeader.substring(7);
            try {
                username = jwtUtil.extractUsername(jwt);
                roles = jwtUtil.extractRoles(jwt);
            } catch (ExpiredJwtException e) {
                System.out.println("JWT Token has expired");
            } catch (SignatureException e) {
                System.out.println("JWT signature does not match locally computed signature.");
            } catch (MalformedJwtException e) {
                System.out.println("Invalid JWT Token format.");
            } catch (Exception e) {
                // This will now give you a more detailed message
                System.out.println("Error parsing JWT Token: " + e.getMessage());
            }
        }

        // If we have a username and the user is not already authenticated in this session
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            // We don't need UserDetails anymore, we have the roles from the token.
            // Check if token is valid (this implementation just checks expiration)
            if (jwtUtil.validateToken(jwt, username)) { // Simplified validation

                // Create the list of authorities from the roles extracted from the token
                List<SimpleGrantedAuthority> authorities = roles.stream()
                        .map(SimpleGrantedAuthority::new)
                        .collect(Collectors.toList());

                // Create the authentication token
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        username, null, authorities); // Use username as principal

                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // Set the authentication in the security context
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }
        chain.doFilter(request, response);
    }
}